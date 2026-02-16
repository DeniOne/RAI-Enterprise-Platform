import { Module } from '@nestjs/common';
import { EconomyService } from './application/economy.service';
import { ReconciliationJob } from './application/reconciliation.job';
import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { OutboxModule } from '../../../shared/outbox/outbox.module';

@Module({
    imports: [PrismaModule, OutboxModule],
    providers: [EconomyService, ReconciliationJob],
    exports: [EconomyService],
})
export class EconomyModule { }
