import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { TenantScope } from './tenant-scope';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
    constructor(private readonly tenantContext: TenantContextService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // We expect the user to be already authenticated by JwtAuthGuard
        if (!user || !user.companyId) {
            // If it's a public route or health check, we might allow it without tenant,
            // but for anything interacting with DB, we need it.
            // For now, let's just proceed; PrismaService will throw if scoped.
            return next.handle();
        }

        return new Observable((subscriber) => {
            const scope = new TenantScope(user.companyId);
            this.tenantContext.run({ scope }, () => {
                next.handle().subscribe(subscriber);
            });
        });
    }
}
