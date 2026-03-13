import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Observable, from, of, throwError } from "rxjs";
import { tap, catchError, mergeMap } from "rxjs/operators";
import { RedisService } from "../redis/redis.service";

/**
 * Интерсептор для обеспечения идемпотентности запросов (Level F).
 * Использует заголовок `Idempotency-Key` или `jti` из JWT.
 * Работает через Redis для распределенных блокировок.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Разрешаем только мутирующие методы
    if (request.method === "GET" || request.method === "OPTIONS") {
      return next.handle();
    }

    // Пытаемся взять ключ из заголовка или из токена (jti)
    const idempotencyKey =
      (request.headers["idempotency-key"] as string) ||
      (request.user?.jti as string);

    if (!idempotencyKey) {
      // Если ключ не передан, мы можем либо упасть, либо пропустить.
      // Для Level F лучше падать, требуя ключ для мутаций.
      this.logger.warn(
        `Missing Idempotency-Key or jti for ${request.method} ${request.url}`,
      );
      throw new HttpException(
        "Idempotency-Key header is required",
        HttpStatus.BAD_REQUEST,
      );
    }

    const routeScope =
      (request.route?.path as string | undefined) ||
      (request.url as string | undefined) ||
      null;
    const scopeParts = [
      request.user?.companyId as string | undefined,
      request.user?.userId as string | undefined,
      routeScope ? (request.method as string | undefined) : undefined,
      routeScope ?? undefined,
    ].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    const cacheKey = scopeParts.length > 0
      ? `idempotency:${scopeParts.join(":")}:${idempotencyKey}`
      : `idempotency:${idempotencyKey}`;

    // Проверяем статус в Redis
    const cachedState = await this.redisService.get(cacheKey);

    if (cachedState) {
      let stateObj: any;
      try {
        stateObj = JSON.parse(cachedState);
      } catch {
        // Битое кэш-состояние не должно блокировать мутацию.
        await this.redisService.del(cacheKey);
        stateObj = null;
      }

      if (stateObj?.status === "IN_PROGRESS") {
        throw new HttpException(
          "Request is already in progress",
          HttpStatus.CONFLICT,
        );
      }

      if (stateObj?.status === "COMPLETED") {
        this.logger.debug(
          `Returning cached response for idempotency key: ${idempotencyKey}`,
        );
        return of(stateObj.response);
      }

      if (stateObj?.status === "ERROR") {
        const status = Number(stateObj?.error?.status) || HttpStatus.INTERNAL_SERVER_ERROR;
        const message =
          typeof stateObj?.error?.message === "string" && stateObj.error.message.trim().length > 0
            ? stateObj.error.message
            : "Internal Error";

        // 5xx ошибки считаем временными: очищаем ключ и разрешаем повтор.
        if (status >= 500) {
          await this.redisService.del(cacheKey);
        } else {
          throw new HttpException(message, status);
        }
      }
    }

    // Если ключа нет, ставим статус IN_PROGRESS (TTL 2 минуты на случай падения процесса)
    const acquired = await this.redisService.setNX(
      cacheKey,
      JSON.stringify({ status: "IN_PROGRESS" }),
      120,
    );

    if (!acquired) {
      throw new HttpException(
        "Request is already in progress (concurrent)",
        HttpStatus.CONFLICT,
      );
    }

    // Выполняем запрос
    return next.handle().pipe(
      tap(async (response) => {
        // Успешное выполнение: сохраняем результат на 24 часа
        await this.redisService.set(
          cacheKey,
          JSON.stringify({ status: "COMPLETED", response }),
          86400, // 24 hours
        );
      }),
      catchError((err) => {
        // 4xx кэшируем дольше, 5xx — коротко, чтобы не фиксировать временный сбой.
        const httpError =
          err instanceof HttpException
            ? err
            : new HttpException("Internal Error", 500);
        const status = httpError.getStatus();
        const errorTtlSeconds = status >= 500 ? 60 : 86400;

        return from(
          this.redisService.set(
            cacheKey,
            JSON.stringify({
              status: "ERROR",
              error: {
                message: httpError.message,
                status,
              },
            }),
            errorTtlSeconds,
          ),
        ).pipe(mergeMap(() => throwError(() => err)));
      }),
    );
  }
}
