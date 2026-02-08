import { Module } from '@nestjs/common';
import { StrategicController } from './strategic.controller';
import { StrategicService } from './strategic.service';
import { RdModule } from '../rd/rd.module';
import { LegalModule } from '../legal/legal.module';
import { RiskModule } from '../risk/risk.module';

@Module({
    imports: [
        RdModule,
        LegalModule,
        RiskModule
    ],
    controllers: [StrategicController],
    providers: [StrategicService],
    exports: []
})
export class StrategicModule {
    constructor() {
        console.log('✅ StrategicModule initialized');
    }
}
