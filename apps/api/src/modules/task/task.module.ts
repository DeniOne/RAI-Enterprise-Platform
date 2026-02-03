import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskResolver } from './task.resolver';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuditModule } from '../../shared/audit/audit.module';

@Module({
    imports: [PrismaModule, AuditModule],
    providers: [TaskService, TaskResolver],
    exports: [TaskService],
})
export class TaskModule { }
