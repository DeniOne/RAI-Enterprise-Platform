import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { Task, TaskStatus, SeasonStatus, User } from '@prisma/client';

@Injectable()
export class TaskService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly auditService: AuditService,
    ) { }

    /**
     * Idempotent task generation from a Season's Technology Card.
     * Rule: 1 Operation = 1 Task on the field.
     * 
     * [CONSTRAINT]: Tasks created via this method MUST have a valid operationId.
     * Nullable operationId in DB is reserved for future 'Manual/Unplanned' tasks.
     */
    async createTasksFromSeason(seasonId: string, companyId: string): Promise<Task[]> {
        const season = await this.prisma.season.findFirst({
            where: { id: seasonId, companyId },
            include: {
                technologyCard: {
                    include: {
                        operations: true,
                    },
                },
                field: true,
            },
        });

        if (!season) {
            throw new NotFoundException(`Season ${seasonId} not found or access denied`);
        }

        if (season.isLocked || season.status === SeasonStatus.COMPLETED) {
            throw new BadRequestException(`Cannot generate tasks for a locked or completed season`);
        }

        if (!season.technologyCard) {
            throw new BadRequestException(`Season ${seasonId} has no Technology Card assigned`);
        }

        const tasks: Task[] = [];

        // Transactional creation with idempotency check
        return this.prisma.$transaction(async (tx) => {
            for (const operation of season.technologyCard.operations) {
                // Idempotency: skip if task for this operation and season already exists
                const existingTask = await tx.task.findFirst({
                    where: {
                        seasonId,
                        operationId: operation.id,
                        fieldId: season.fieldId,
                    }
                });

                if (existingTask) continue;

                const task = await tx.task.create({
                    data: {
                        name: operation.name,
                        status: TaskStatus.PENDING,
                        seasonId: season.id,
                        operationId: operation.id,
                        fieldId: season.fieldId,
                        companyId: season.companyId,
                        // Copied at creation time - read-only from now on
                    }
                });
                tasks.push(task);
            }

            if (tasks.length > 0) {
                await this.auditService.log({
                    action: 'SYSTEM_TASK_GENERATION',
                    userId: 'SYSTEM',
                    metadata: { seasonId, count: tasks.length }
                });
            }

            return tasks;
        });
    }

    async assignTask(taskId: string, assigneeId: string, user: User, companyId: string): Promise<Task> {
        const task = await this._validateTaskAccess(taskId, companyId);
        this._ensureNotTerminal(task);

        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: { assigneeId },
        });

        await this.auditService.log({
            action: 'TASK_ASSIGNED',
            userId: user.id,
            metadata: { taskId, assigneeId }
        });
        return updated;
    }

    async startTask(taskId: string, user: User, companyId: string): Promise<Task> {
        const task = await this._validateTaskAccess(taskId, companyId);
        this._ensureStatus(task, TaskStatus.PENDING);

        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: { status: TaskStatus.IN_PROGRESS },
        });

        await this.auditService.log({
            action: 'TASK_STARTED',
            userId: user.id,
            metadata: { taskId }
        });
        return updated;
    }

    async completeTask(taskId: string, actualResources: any[], user: User, companyId: string): Promise<Task> {
        const task = await this._validateTaskAccess(taskId, companyId);
        this._ensureStatus(task, TaskStatus.IN_PROGRESS);

        const updated = await this.prisma.$transaction(async (tx) => {
            const completed = await tx.task.update({
                where: { id: taskId },
                data: {
                    status: TaskStatus.COMPLETED,
                    completedAt: new Date(),
                }
            });

            if (actualResources && actualResources.length > 0) {
                // [NOTE]: TaskResourceActual is an event log (fact journal). 
                // It does NOT aggregate values. Financial aggregation belongs to a separate layer.
                await tx.taskResourceActual.createMany({
                    data: actualResources.map(res => ({
                        taskId,
                        type: res.type,
                        name: res.name,
                        amount: res.amount,
                        unit: res.unit,
                    }))
                });
            }

            return completed;
        });

        await this.auditService.log({
            action: 'TASK_COMPLETED',
            userId: user.id,
            metadata: { taskId, resourcesCount: actualResources?.length }
        });
        return updated;
    }

    async cancelTask(taskId: string, reason: string, user: User, companyId: string): Promise<Task> {
        const task = await this._validateTaskAccess(taskId, companyId);
        this._ensureNotTerminal(task);

        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: { status: TaskStatus.CANCELLED },
        });

        await this.auditService.log({
            action: 'TASK_CANCELLED',
            userId: user.id,
            metadata: { taskId, reason }
        });
        return updated;
    }

    // --- Helpers ---

    private async _validateTaskAccess(taskId: string, companyId: string): Promise<Task & { season: { isLocked: boolean, status: SeasonStatus } }> {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, companyId },
            include: { season: { select: { isLocked: true, status: true } } }
        });

        if (!task) {
            throw new NotFoundException(`Task ${taskId} not found or access denied`);
        }

        if (task.season.isLocked || task.season.status === SeasonStatus.COMPLETED) {
            throw new BadRequestException(`Cannot modify task in a locked or completed season`);
        }

        return task as any;
    }

    private _ensureNotTerminal(task: Task): void {
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
            throw new BadRequestException(`Task ${task.id} is in a terminal state (${task.status})`);
        }
    }

    private _ensureStatus(task: Task, required: TaskStatus): void {
        if (task.status !== required) {
            throw new BadRequestException(`Task ${task.id} status must be ${required} (current: ${task.status})`);
        }
    }
}
