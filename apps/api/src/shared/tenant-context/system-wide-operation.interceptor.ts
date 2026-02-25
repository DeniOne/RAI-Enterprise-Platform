import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { TenantContextService } from "./tenant-context.service";
import { Reflector } from "@nestjs/core";
import { SYSTEM_WIDE_KEY } from "./system-wide-operation.decorator";
import { TenantScope } from "./tenant-scope";

@Injectable()
export class SystemWideOperationInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isSystemWide = this.reflector.getAllAndOverride<boolean>(
      SYSTEM_WIDE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isSystemWide) {
      const currentStore = this.tenantContext.getStore();
      const companyId = currentStore?.companyId || "SYSTEM";

      return new Observable((subscriber) => {
        this.tenantContext.run(
          {
            scope: new TenantScope(companyId, true),
          },
          () => {
            next.handle().subscribe(subscriber);
          },
        );
      });
    }

    return next.handle();
  }
}
