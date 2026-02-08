import { Module } from '@nestjs/common';
import { IntegrationService } from './application/integration.service';
import { EconomyModule } from '../economy/economy.module';

@Module({
    imports: [EconomyModule],
    providers: [IntegrationService],
    exports: [IntegrationService],
})
export class IntegrationsModule { }
