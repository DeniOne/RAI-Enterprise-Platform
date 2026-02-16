import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { IntegrationService } from "../finance-economy/integrations/application/integration.service";
import { OutboxService } from "../../shared/outbox/outbox.service";
import { Task, TaskStatus, Prisma, User, SeasonStatus } from "@rai/prisma-client";
import {
  TaskStateMachine,
  TaskEvent,
} from "../../shared/state-machine";
import { assertTransitionAllowed } from "../../shared/state-machine/fsm-transition-policy";

@Injectable()
export class TaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly integrationService: IntegrationService,
    private readonly outbox: OutboxService,
  ) { }

  /**
   * Idempotent task generation from a Season's Technology Card.
   * Rule: 1 Operation = 1 Task on the field.
   *
   * [CONSTRAINT]: Tasks created via this method MUST have a valid operationId.
   * Nullable operationId in DB is reserved for future 'Manual/Unplanned' tasks.
   */
  async createTasksFromSeason(
    seasonId: string,
    companyId: string,
  ): Promise<Task[]> {
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
      throw new NotFoundException(
        `Season ${seasonId} not found or access denied`,
      );
    }

    if (season.isLocked || season.status === SeasonStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot generate tasks for a locked or completed season`,
      );
    }

    if (!season.technologyCard) {
      throw new BadRequestException(
        `Season ${seasonId} has no Technology Card assigned`,
      );
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
          },
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
          },
        });
        tasks.push(task);
      }

      if (tasks.length > 0) {
        await this.auditService.log({
          action: "SYSTEM_TASK_GENERATION",
          userId: "SYSTEM",
          metadata: { seasonId, count: tasks.length },
        });
      }

      return tasks;
    });
  }

  async assignTask(
    taskId: string,
    assigneeId: string,
    user: User,
    companyId: string,
  ): Promise<Task> {
    const task = await this._validateTaskAccess(taskId, companyId);

    assertTransitionAllowed("TASK", task.status, TaskEvent.ASSIGN);

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });

    await this.auditService.log({
      action: "TASK_ASSIGNED",
      userId: user.id,
      metadata: { taskId, assigneeId },
    });
    return updated;
  }

  async startTask(
    taskId: string,
    user: User,
    companyId: string,
  ): Promise<Task> {
    const task = await this._validateTaskAccess(taskId, companyId);

    assertTransitionAllowed("TASK", task.status, TaskEvent.START);
    // FSM Transition (Pure)
    const result = TaskStateMachine.transition(task, TaskEvent.START);

    const updated = await this.applyTaskStatusTransition(
      taskId,
      companyId,
      task.status,
      result.status,
      { event: TaskEvent.START, actorId: user.id },
    );

    await this.auditService.log({
      action: "TASK_STARTED",
      userId: user.id,
      metadata: { taskId },
    });
    return updated;
  }

  async completeTask(
    taskId: string,
    actualResources: any[],
    user: User,
    companyId: string,
  ): Promise<Task> {
    const task = await this._validateTaskAccess(taskId, companyId);

    assertTransitionAllowed("TASK", task.status, TaskEvent.COMPLETE);
    // FSM Transition (Pure)
    const result = TaskStateMachine.transition(task, TaskEvent.COMPLETE);

    const updated = await this.prisma.$transaction(async (tx) => {
      const completedCount = await tx.task.updateMany({
        where: {
          id: taskId,
          companyId,
          status: task.status,
        },
        data: {
          status: result.status,
          completedAt: new Date(),
        },
      });
      if (completedCount.count === 0) {
        throw new ConflictException(
          `Task transition conflict for ${taskId}: state changed concurrently`,
        );
      }
      const completed = await tx.task.findFirst({
        where: { id: taskId, companyId },
      });
      if (!completed) {
        throw new NotFoundException(`Task ${taskId} not found or access denied`);
      }

      if (actualResources && actualResources.length > 0) {
        // [NOTE]: TaskResourceActual is an event log (fact journal).
        // It does NOT aggregate values. Financial aggregation belongs to a separate layer.
        await tx.taskResourceActual.createMany({ // tenant-lint:ignore tenant scope inherited from taskId relation
          data: actualResources.map((res) => ({
            taskId,
            type: res.type,
            name: res.name,
            amount: res.amount,
            unit: res.unit,
          })),
        });

        // INTEGRATION: Notify Finance & Economy module
        // Assuming IntegrationService is injected as this.integrationService
        if (this.integrationService) {
          const totalAmount = actualResources.reduce((sum, res) => sum + (res.cost || 0), 0);
          await this.integrationService.handleTaskCompletion({
            taskId,
            companyId: task.companyId,
            seasonId: task.seasonId,
            fieldId: task.fieldId,
            amount: totalAmount,
          });
        }
      }

      await tx.outboxMessage.create({
        data: this.outbox.createEvent(
          taskId,
          "Task",
          "task.status.transitioned",
          {
            companyId,
            taskId,
            fromStatus: task.status,
            toStatus: result.status,
            event: TaskEvent.COMPLETE,
            actorId: user.id,
            occurredAt: new Date().toISOString(),
          },
        ),
      });

      return completed;
    });

    await this.auditService.log({
      action: "TASK_COMPLETED",
      userId: user.id,
      metadata: { taskId, resourcesCount: actualResources?.length },
    });
    return updated;
  }

  async cancelTask(
    taskId: string,
    reason: string,
    user: User,
    companyId: string,
  ): Promise<Task> {
    const task = await this._validateTaskAccess(taskId, companyId);

    assertTransitionAllowed("TASK", task.status, TaskEvent.CANCEL);
    // FSM Transition (Pure)
    const result = TaskStateMachine.transition(task, TaskEvent.CANCEL);

    const updated = await this.applyTaskStatusTransition(
      taskId,
      companyId,
      task.status,
      result.status,
      { event: TaskEvent.CANCEL, actorId: user.id },
    );

    await this.auditService.log({
      action: "TASK_CANCELLED",
      userId: user.id,
      metadata: { taskId, reason },
    });
    return updated;
  }

  // --- Helpers ---

  private async _validateTaskAccess(
    taskId: string,
    companyId: string,
  ): Promise<Task & { season: { isLocked: boolean; status: SeasonStatus } }> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, companyId },
      include: { season: { select: { isLocked: true, status: true } } },
    });

    if (!task) {
      throw new NotFoundException(`Task ${taskId} not found or access denied`);
    }

    if (task.season.isLocked || task.season.status === SeasonStatus.COMPLETED) {
      throw new BadRequestException(
        `Cannot modify task in a locked or completed season`,
      );
    }

    return task as any;
  }

  private async applyTaskStatusTransition(
    taskId: string,
    companyId: string,
    currentStatus: TaskStatus,
    targetStatus: TaskStatus,
    transitionMeta: { event: TaskEvent; actorId?: string },
  ): Promise<Task> {
    return this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.task.updateMany({
        where: {
          id: taskId,
          companyId,
          status: currentStatus,
        },
        data: {
          status: targetStatus,
        },
      });

      if (updateResult.count === 0) {
        throw new ConflictException(
          `Task transition conflict for ${taskId}: state changed concurrently`,
        );
      }

      const updated = await tx.task.findFirst({
        where: { id: taskId, companyId },
      });
      if (!updated) {
        throw new NotFoundException(`Task ${taskId} not found or access denied`);
      }

      await tx.outboxMessage.create({
        data: this.outbox.createEvent(
          taskId,
          "Task",
          "task.status.transitioned",
          {
            companyId,
            taskId,
            fromStatus: currentStatus,
            toStatus: targetStatus,
            event: transitionMeta.event,
            actorId: transitionMeta.actorId || null,
            occurredAt: new Date().toISOString(),
          },
        ),
      });

      return updated as Task;
    });
  }
}
