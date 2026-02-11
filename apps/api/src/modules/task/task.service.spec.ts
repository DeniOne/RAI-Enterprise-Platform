import { Test, TestingModule } from "@nestjs/testing";
import { TaskService } from "./task.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { TaskStatus, SeasonStatus, User } from "@rai/prisma-client";
import { NotFoundException, BadRequestException } from "@nestjs/common";

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
    },
    taskResourceActual: {
      createMany: jest.fn(),
    },
    season: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prismaMock)),
  };

  const auditMock = {
    log: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
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
      prismaMock.task.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.startTask("task-1", mockUser, "company-1");

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(auditMock.log).toHaveBeenCalledWith(
        "TASK_STARTED",
        expect.anything(),
        expect.anything(),
      );
    });

    it("should block COMPLETED -> IN_PROGRESS (Terminal guard)", async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      await expect(
        service.startTask("task-1", mockUser, "company-1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("should complete task and save resource actuals", async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });
      prismaMock.task.update.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.COMPLETED,
      });

      const actuals = [{ type: "FUEL", name: "Diesel", amount: 50, unit: "L" }];
      await service.completeTask("task-1", actuals, mockUser, "company-1");

      expect(prismaMock.taskResourceActual.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: "Diesel", amount: 50 }),
        ]),
      });
    });

    it("should enforce tenant isolation", async () => {
      prismaMock.task.findFirst.mockResolvedValue(null); // No task found for this company

      await expect(
        service.startTask("task-1", mockUser, "wrong-company"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
