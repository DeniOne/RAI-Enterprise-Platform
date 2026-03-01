import { BadRequestException } from "@nestjs/common";
import { AgroEventsOrchestratorService } from "./agro-events.orchestrator.service";
import { AgroEventsRepository } from "./agro-events.repository";
import { AgroEventsMustValidator } from "./agro-events.validator";

describe("AgroEventsOrchestratorService", () => {
  let service: AgroEventsOrchestratorService;
  let repository: jest.Mocked<AgroEventsRepository>;
  let validator: jest.Mocked<AgroEventsMustValidator>;

  const actor = { companyId: "company-1", userId: "user-1" };
  const baseDraft = {
    id: "draft-1",
    companyId: actor.companyId,
    userId: actor.userId,
    status: "DRAFT" as const,
    eventType: "OBSERVATION",
    timestamp: "2026-03-01T12:00:00.000Z",
    farmRef: "farm-1",
    fieldRef: null,
    taskRef: null,
    payload: { observationKind: "WEED" },
    evidence: [],
    confidence: 0.8,
    missingMust: ["fieldRef", "evidence"],
    createdAt: "2026-03-01T12:00:00.000Z",
    updatedAt: "2026-03-01T12:00:00.000Z",
    expiresAt: "2026-03-08T12:00:00.000Z",
  };

  beforeEach(() => {
    repository = {
      createDraft: jest.fn(),
      getDraft: jest.fn(),
      updateDraft: jest.fn(),
      findCommitted: jest.fn(),
      commitDraft: jest.fn(),
    } as unknown as jest.Mocked<AgroEventsRepository>;

    validator = {
      validateMust: jest.fn(),
    } as unknown as jest.Mocked<AgroEventsMustValidator>;

    service = new AgroEventsOrchestratorService(repository, validator);
  });

  it("confirm() не вызывает commit при непустом missingMust", async () => {
    repository.getDraft.mockResolvedValue(baseDraft);
    validator.validateMust.mockReturnValue(["fieldRef"]);
    repository.updateDraft.mockResolvedValue({
      ...baseDraft,
      missingMust: ["fieldRef"],
      status: "DRAFT",
    });

    const result = await service.confirm(actor, baseDraft.id);

    expect(repository.commitDraft).not.toHaveBeenCalled();
    expect(repository.updateDraft).toHaveBeenCalledWith(
      actor.companyId,
      actor.userId,
      baseDraft.id,
      expect.objectContaining({
        missingMust: ["fieldRef"],
        status: "DRAFT",
      }),
    );
    expect(result.draft.status).toBe("DRAFT");
  });

  it("link() переводит draft в READY_FOR_CONFIRM при закрытии MUST", async () => {
    repository.getDraft.mockResolvedValue(baseDraft);
    validator.validateMust.mockReturnValue([]);
    repository.updateDraft.mockResolvedValue({
      ...baseDraft,
      fieldRef: "field-1",
      missingMust: [],
      status: "READY_FOR_CONFIRM",
    });

    const result = await service.link(actor, {
      draftId: baseDraft.id,
      fieldRef: "field-1",
    });

    expect(repository.updateDraft).toHaveBeenCalledWith(
      actor.companyId,
      actor.userId,
      baseDraft.id,
      expect.objectContaining({
        fieldRef: "field-1",
        missingMust: [],
        status: "READY_FOR_CONFIRM",
      }),
    );
    expect(result.draft.status).toBe("READY_FOR_CONFIRM");
  });

  it("confirm() при пустом MUST создаёт committed и переводит draft в COMMITTED", async () => {
    const readyDraft = {
      ...baseDraft,
      fieldRef: "field-1",
      evidence: [{ type: "photo", url: "https://example.test/photo.jpg" }],
      missingMust: [],
      status: "READY_FOR_CONFIRM" as const,
    };

    repository.getDraft.mockResolvedValue(readyDraft);
    validator.validateMust.mockReturnValue([]);
    repository.commitDraft.mockResolvedValue({
      draft: {
        ...readyDraft,
        status: "COMMITTED",
      },
      committed: {
        id: readyDraft.id,
        companyId: actor.companyId,
        farmRef: readyDraft.farmRef,
        fieldRef: readyDraft.fieldRef,
        taskRef: readyDraft.taskRef,
        eventType: readyDraft.eventType,
        payload: readyDraft.payload,
        evidence: readyDraft.evidence,
        timestamp: readyDraft.timestamp,
        committedAt: "2026-03-01T12:01:00.000Z",
        committedBy: actor.userId,
        provenanceHash: "hash-1",
      },
    });

    const result = await service.confirm(actor, readyDraft.id);

    expect(repository.commitDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: actor.companyId,
        userId: actor.userId,
        draftId: readyDraft.id,
        provenanceHash: expect.any(String),
      }),
    );
    expect(result.draft.status).toBe("COMMITTED");
    expect(result.committed?.provenanceHash).toBeTruthy();
  });

  it("commit() бросает ошибку при непустом MUST", async () => {
    repository.getDraft.mockResolvedValue(baseDraft);
    validator.validateMust.mockReturnValue(["fieldRef"]);
    repository.updateDraft.mockResolvedValue({
      ...baseDraft,
      missingMust: ["fieldRef"],
      status: "DRAFT",
    });

    await expect(
      service.commit(actor, { draftId: baseDraft.id }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(repository.commitDraft).not.toHaveBeenCalled();
  });
});
