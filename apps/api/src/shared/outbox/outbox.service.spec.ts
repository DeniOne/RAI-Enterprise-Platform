import { OutboxService } from "./outbox.service";

describe("OutboxService tenant contract", () => {
  let service: OutboxService;
  let wakeupService: {
    publishHint: jest.Mock;
  };

  beforeEach(() => {
    wakeupService = {
      publishHint: jest.fn().mockResolvedValue(undefined),
    };
    service = new OutboxService(wakeupService as any);
  });

  it("rejects event creation without companyId by default", () => {
    expect(() =>
      service.createEvent(
        "agg-1",
        "EconomicEvent",
        "finance.economic_event.created",
        {
          economicEventId: "evt-1",
        },
      ),
    ).toThrow(/requires payload\.companyId/i);
  });

  it("allows event creation with companyId", () => {
    const outbox = service.createEvent(
      "agg-1",
      "EconomicEvent",
      "finance.economic_event.created",
      {
        companyId: "c1",
        economicEventId: "evt-1",
      },
    );

    expect(outbox.type).toBe("finance.economic_event.created");
    expect(outbox.status).toBe("PENDING");
  });

  it("allows system-scope publish only with explicit allowSystemScope flag", () => {
    expect(() =>
      service.createEvent(
        "agg-1",
        "SystemEvent",
        "system.maintenance.completed",
        { jobId: "j-1" },
        { allowSystemScope: true },
      ),
    ).not.toThrow();
  });

  it("persists event and publishes wakeup hint", async () => {
    const writer = {
      outboxMessage: {
        create: jest.fn().mockResolvedValue(undefined),
        createMany: jest.fn(),
      },
    };

    await service.persistEvent(
      writer as any,
      "agg-1",
      "EconomicEvent",
      "finance.economic_event.created",
      {
        companyId: "c1",
        economicEventId: "evt-1",
      },
    );

    expect(writer.outboxMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "finance.economic_event.created",
        status: "PENDING",
      }),
    });
    expect(wakeupService.publishHint).toHaveBeenCalledWith({
      reason: "event_persisted",
      eventType: "finance.economic_event.created",
      companyId: "c1",
      count: 1,
    });
  });

  it("persists prepared batch and publishes a single batch wakeup hint", async () => {
    const writer = {
      outboxMessage: {
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const prepared = [
      service.createEvent(
        "agg-1",
        "EconomicEvent",
        "finance.reconciliation.alert",
        {
          companyId: "c1",
          anomalyType: "MISSING_LEDGER_ENTRIES",
        },
      ),
      service.createEvent(
        "agg-2",
        "EconomicEvent",
        "finance.reconciliation.alert",
        {
          companyId: "c1",
          anomalyType: "DOUBLE_ENTRY_MISMATCH",
        },
      ),
    ];

    await service.persistPreparedEvents(writer as any, prepared);

    expect(writer.outboxMessage.createMany).toHaveBeenCalledWith({
      data: prepared,
    });
    expect(wakeupService.publishHint).toHaveBeenCalledWith({
      reason: "batch_persisted",
      eventType: "finance.reconciliation.alert",
      companyId: "c1",
      count: 2,
    });
  });
});
