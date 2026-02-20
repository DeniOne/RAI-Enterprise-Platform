import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Response } from 'express';

/**
 * SLA/SLO Contract Layer (Фаза 4)
 * Отслеживает контракты по задержке (Latency) и успешности (Availability).
 * Добавляет заголовки метрик в ответ.
 */
@Injectable()
export class SloInterceptor implements NestInterceptor {
    private readonly logger = new Logger(SloInterceptor.name);

    // Strict latency budget for Level F
    private readonly SLO_LATENCY_BUDGET_MS = 250;

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const httpContext = context.switchToHttp();
        const req = httpContext.getRequest();
        const res = httpContext.getResponse<Response>();

        return next.handle().pipe(
            tap(() => {
                const executionTime = Date.now() - now;
                res.setHeader('X-Response-Time', `${executionTime}ms`);

                if (executionTime > this.SLO_LATENCY_BUDGET_MS) {
                    this.logger.warn(`SLO Violation [Latency]: ${req.method} ${req.url} took ${executionTime}ms (Budget: ${this.SLO_LATENCY_BUDGET_MS}ms)`);
                    res.setHeader('X-SLO-Status', 'VIOLATED');
                } else {
                    res.setHeader('X-SLO-Status', 'MET');
                }
            }),
            catchError(err => {
                const executionTime = Date.now() - now;
                res.setHeader('X-Response-Time', `${executionTime}ms`);
                res.setHeader('X-SLO-Status', 'DROPPED');

                this.logger.error(`SLO Violation [Error]: ${req.method} ${req.url} failed after ${executionTime}ms`);
                return throwError(() => err);
            }),
        );
    }
}
