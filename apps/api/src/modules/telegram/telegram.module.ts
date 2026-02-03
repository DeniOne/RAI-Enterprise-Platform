import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { TaskModule } from '../task/task.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { ProgressService } from './progress.service';

@Module({
    imports: [TaskModule, PrismaModule],
    providers: [TelegramUpdate, ProgressService],
    exports: [ProgressService],
})
export class TelegramModule { }
