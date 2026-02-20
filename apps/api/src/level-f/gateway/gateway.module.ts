import { Module, Global } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { MtlsGuard } from './mtls.guard';
import { TokenBucketGuard } from './token-bucket.guard';
import { PrivacySchemaHandlerService } from './privacy-schema-handler.service';
import { SloInterceptor } from './slo.interceptor';
import { ReplayModule } from './replay/replay.module';
import { CrlModule } from './crl/crl.module';
import { AnchorModule } from './anchoring/anchor.module';

@Global()
@Module({
    imports: [ReplayModule, CrlModule, AnchorModule],
    providers: [
        MtlsGuard,
        {
            provide: APP_GUARD,
            useClass: MtlsGuard,
        },
        {
            provide: APP_GUARD,
            useClass: TokenBucketGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: SloInterceptor,
        },
        PrivacySchemaHandlerService,
    ],
    exports: [PrivacySchemaHandlerService, ReplayModule, CrlModule, AnchorModule],
})
export class GatewayModule { }
