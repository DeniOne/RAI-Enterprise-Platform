import { Global, Module } from "@nestjs/common";
import { TenantContextService } from "./tenant-context.service";
import { TenantContextInterceptor } from "./tenant-context.interceptor";
import { SystemWideOperationInterceptor } from "./system-wide-operation.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";

@Global()
@Module({
  providers: [
    TenantContextService,
    SystemWideOperationInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
  exports: [TenantContextService],
})
export class TenantContextModule {}
