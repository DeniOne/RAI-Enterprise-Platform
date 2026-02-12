import { Module } from '@nestjs/common';
import { StrategicController } from './strategic.controller';
import { StrategicService } from './strategic.service';
import { AdvisoryService } from './advisory.service';
import { RdModule } from '../rd/rd.module';
import { LegalModule } from '../legal/legal.module';
import { RiskModule } from '../risk/risk.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
    imports: [
        RdModule,
        LegalModule,
        RiskModule,
        PrismaModule
    ],
    controllers: [StrategicController],
    providers: [StrategicService, AdvisoryService],
    exports: []
})
export class StrategicModule {
    constructor() {
        console.log('✅ StrategicModule initialized');
    }
}
