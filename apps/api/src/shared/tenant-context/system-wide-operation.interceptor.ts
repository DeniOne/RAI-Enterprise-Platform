import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { Reflector } from '@nestjs/core';
import { SYSTEM_WIDE_KEY } from './system-wide-operation.decorator';

@Injectable()
export class SystemWideOperationInterceptor implements NestInterceptor {
    constructor(
        private readonly tenantContext: TenantContextService,
        private readonly reflector: Reflector,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const isSystemWide = this.reflector.getAllAndOverride<boolean>(SYSTEM_WIDE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isSystemWide) {
            // Re-run the context with isSystem: true
            // Note: This assumes current context might already have a tenantId or be empty (Cron)
            const currentStore = this.tenantContext.getStore() || { companyId: 'SYSTEM' };
            return new Observable((subscriber) => {
                this.tenantContext.run({ ...currentStore, isSystem: true }, () => {
                    next.handle().subscribe(subscriber);
                });
            });
        }

        return next.handle();
    }
}
