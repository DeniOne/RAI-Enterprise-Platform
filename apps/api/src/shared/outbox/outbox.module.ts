import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { OutboxRelay } from './outbox.relay';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [PrismaModule, ScheduleModule.forRoot()],
    providers: [OutboxService, OutboxRelay],
    exports: [OutboxService],
})
export class OutboxModule { }
