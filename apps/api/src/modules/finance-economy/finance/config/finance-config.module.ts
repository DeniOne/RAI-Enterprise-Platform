import { Module, Global } from '@nestjs/common';
import { FinanceConfigService } from './finance-config.service';

@Global()
@Module({
    providers: [FinanceConfigService],
    exports: [FinanceConfigService],
})
export class FinanceConfigModule { }
