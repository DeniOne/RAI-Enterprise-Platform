import { Module } from '@nestjs/common';
import { FoundationModule } from './foundation/foundation.module';
import { IncentiveModule } from './incentive/incentive.module';
import { DevelopmentModule } from './development/development.module';

@Module({
    imports: [FoundationModule, IncentiveModule, DevelopmentModule],
    exports: [FoundationModule, IncentiveModule, DevelopmentModule],
})
export class HrModule { }
