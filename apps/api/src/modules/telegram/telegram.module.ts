import { Module } from '@nestjs/common';
import { TelegramUpdate } from './telegram.update';
import { TaskModule } from '../task/task.module';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
    imports: [TaskModule, PrismaModule],
    providers: [TelegramUpdate],
})
export class TelegramModule { }
