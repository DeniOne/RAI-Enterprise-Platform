import { Global, Module } from "@nestjs/common";
import { TenantContextService } from "./tenant-context.service";
import { TenantContextInterceptor } from "./tenant-context.interceptor";
import { SystemWideOperationInterceptor } from "./system-wide-operation.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TenantIdentityResolverService } from "./tenant-identity-resolver.service";

@Global()
@Module({
  providers: [
    TenantContextService,
    TenantIdentityResolverService,
    SystemWideOperationInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
  exports: [TenantContextService, TenantIdentityResolverService],
})
export class TenantContextModule {}
