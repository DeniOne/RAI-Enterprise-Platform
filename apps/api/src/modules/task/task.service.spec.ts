import { Test, TestingModule } from "@nestjs/testing";
import { TaskService } from "./task.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { IntegrationService } from "../finance-economy/integrations/application/integration.service";
import { OutboxService } from "../../shared/outbox/outbox.service";
import { TaskStatus, SeasonStatus, User } from "@rai/prisma-client";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";

describe("TaskService", () => {
  let service: TaskService;

  const mockUser: User = { id: "user-1", companyId: "company-1" } as any;

  const mockTask = {
    id: "task-1",
    status: TaskStatus.PENDING,
    companyId: "company-1",
    seasonId: "season-1",
    fieldId: "field-1",
    season: { isLocked: false, status: SeasonStatus.ACTIVE },
  };

  const prismaMock = {
    task: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    taskResourceActual: {
      createMany: jest.fn(),
    },
    outboxMessage: {
      create: jest.fn(),
    },
    season: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prismaMock)),
  };

  const auditMock = {
    log: jest.fn().mockResolvedValue({}),
  };

  const integrationMock = {
    handleTaskCompletion: jest.fn().mockResolvedValue({}),
  };

  const outboxMock = {
    createEvent: jest.fn().mockReturnValue({
      aggregateId: "task-1",
      aggregateType: "Task",
      type: "task.status.transitioned",
      payload: { companyId: "company-1" },
      status: "PENDING",
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: IntegrationService, useValue: integrationMock },
        { provide: OutboxService, useValue: outboxMock },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);

    jest.clearAllMocks();
  });

  describe("createTasksFromSeason (Idempotency)", () => {
    it("should create tasks if they do not exist", async () => {
      const mockSeason = {
        id: "season-1",
        companyId: "company-1",
        isLocked: false,
        status: SeasonStatus.ACTIVE,
        fieldId: "field-1",
        technologyCard: {
          operations: [{ id: "op-1", name: "Operation 1" }],
        },
      };

      prismaMock.season.findFirst.mockResolvedValue(mockSeason);
      prismaMock.task.findFirst.mockResolvedValue(null); // No existing tasks
      prismaMock.task.create.mockResolvedValue({ id: "new-task" });

      const result = await service.createTasksFromSeason(
        "season-1",
        "company-1",
      );

      expect(prismaMock.task.create).toHaveBeenCalledTimes(1);
      expect(result.length).toBe(1);
    });

    it("should NOT create duplicate tasks for the same operation (Idempotency)", async () => {
      const mockSeason = {
        id: "season-1",
        companyId: "company-1",
        isLocked: false,
        status: SeasonStatus.ACTIVE,
        fieldId: "field-1",
        technologyCard: {
          operations: [{ id: "op-1", name: "Operation 1" }],
        },
      };

      prismaMock.season.findFirst.mockResolvedValue(mockSeason);
      prismaMock.task.findFirst.mockResolvedValue({ id: "existing-task" }); // Task already exists

      const result = await service.createTasksFromSeason(
        "season-1",
        "company-1",
      );

      expect(prismaMock.task.create).not.toHaveBeenCalled();
      expect(result.length).toBe(0);
    });

    it("should throw if season is locked", async () => {
      prismaMock.season.findFirst.mockResolvedValue({ isLocked: true });

      await expect(
        service.createTasksFromSeason("season-1", "company-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("Task Lifecycle & Guards", () => {
    beforeEach(() => {
      prismaMock.task.findFirst.mockResolvedValue(mockTask);
    });

    it("should transition PENDING -> IN_PROGRESS", async () => {
      prismaMock.task.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.task.findFirst
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.PENDING,
          season: { isLocked: false, status: SeasonStatus.ACTIVE },
        })
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.IN_PROGRESS,
        });

      const result = await service.startTask("task-1", mockUser, "company-1");

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(prismaMock.outboxMessage.create).toHaveBeenCalled();
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TASK_STARTED",
          userId: mockUser.id,
        }),
      );
    });

    it("should block COMPLETED -> IN_PROGRESS (Terminal guard)", async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(
        service.startTask("task-1", mockUser, "company-1"),
      ).rejects.toThrow(Error);
    });

    it("should complete task and save resource actuals", async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...mockTask,
        season: { isLocked: false, status: SeasonStatus.ACTIVE },
      });
      prismaMock.task.findFirst
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.IN_PROGRESS,
          season: { isLocked: false, status: SeasonStatus.ACTIVE },
        })
        .mockResolvedValueOnce({
          ...mockTask,
          status: TaskStatus.COMPLETED,
        });
      prismaMock.task.updateMany.mockResolvedValue({ count: 1 });

      const actuals = [{ type: "FUEL", name: "Diesel", amount: 50, unit: "L" }];
      await service.completeTask("task-1", actuals, mockUser, "company-1");

      expect(prismaMock.taskResourceActual.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: "Diesel", amount: 50 }),
        ]),
      });
      expect(prismaMock.outboxMessage.create).toHaveBeenCalled();
    });

    it("should enforce tenant isolation", async () => {
      prismaMock.task.findFirst.mockResolvedValue(null); // No task found for this company

      await expect(
        service.startTask("task-1", mockUser, "wrong-company"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw conflict on concurrent transition", async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.PENDING,
        season: { isLocked: false, status: SeasonStatus.ACTIVE },
      });
      prismaMock.task.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.startTask("task-1", mockUser, "company-1"),
      ).rejects.toThrow(ConflictException);
    });
  });
});
