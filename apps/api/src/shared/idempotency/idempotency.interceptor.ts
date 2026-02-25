import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Observable, of, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
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

    const cacheKey = `idempotency:${idempotencyKey}`;

    // Проверяем статус в Redis
    const cachedState = await this.redisService.get(cacheKey);

    if (cachedState) {
      const stateObj = JSON.parse(cachedState);

      if (stateObj.status === "IN_PROGRESS") {
        throw new HttpException(
          "Request is already in progress",
          HttpStatus.CONFLICT,
        );
      }

      if (stateObj.status === "COMPLETED") {
        this.logger.debug(
          `Returning cached response for idempotency key: ${idempotencyKey}`,
        );
        return of(stateObj.response);
      }

      if (stateObj.status === "ERROR") {
        throw new HttpException(
          stateObj.error.message,
          stateObj.error.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
      catchError(async (err) => {
        // Ошибка: сохраняем ошибку, чтобы повторные запросы тоже падали, либо удаляем (зависит от бизнес лоджики).
        // В классическом REST мы кэшируем и ошибку
        const httpError =
          err instanceof HttpException
            ? err
            : new HttpException("Internal Error", 500);

        await this.redisService.set(
          cacheKey,
          JSON.stringify({
            status: "ERROR",
            error: {
              message: httpError.message,
              status: httpError.getStatus(),
            },
          }),
          86400, // 24 hours
        );

        return throwError(() => err);
      }),
    );
  }
}
