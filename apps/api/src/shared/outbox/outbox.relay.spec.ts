import { OutboxRelay } from "./outbox.relay";

describe("OutboxRelay", () => {
  const sqlText = (query: unknown): string => {
    if (query && typeof query === "object" && "strings" in (query as any)) {
      return ((query as any).strings as readonly string[]).join("?");
    }
    return String(query);
  };

  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function createMessage(overrides: Record<string, unknown> = {}) {
    return {
      id: "msg-1",
      type: "finance.economic_event.created",
      aggregateId: "agg-1",
      aggregateType: "EconomicEvent",
      payload: {
        companyId: "c1",
        eventVersion: 1,
        replayKey: "replay-1",
      },
      attempts: 1,
      localDeliveredAt: null,
      brokerDeliveredAt: null,
      createdAt: new Date("2026-03-12T12:00:00.000Z"),
      ...overrides,
    };
  }

  function createRelay(env?: Record<string, string>) {
    process.env = { ...process.env, ...env };
    const queryRaw = jest.fn();
    const prisma = {
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) =>
        callback({ $queryRaw: queryRaw }),
      ),
      outboxMessage: {
        update: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn().mockResolvedValue({ attempts: 1 }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const eventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue([]),
    };
    const brokerPublisher = {
      publish: jest.fn().mockResolvedValue({
        transport: "redis_streams",
        target: "rai:outbox:c1",
        receiptId: "1710240000000-0",
      }),
      describeConfig: jest.fn().mockReturnValue("test-broker"),
      isConfigured: jest.fn().mockReturnValue(true),
      requiredConfigHint: jest.fn().mockReturnValue("OUTBOX_BROKER_ENDPOINT"),
    };

    const relay = new OutboxRelay(
      prisma as any,
      eventEmitter as any,
      brokerPublisher as any,
    );

    return {
      relay,
      prisma,
      queryRaw,
      eventEmitter,
      brokerPublisher,
    };
  }

  it("claims pending messages with SKIP LOCKED and atomically increments attempt metadata", async () => {
    const { relay, prisma, queryRaw } = createRelay();
    const rows = [{ id: "msg-1" }, { id: "msg-2" }];
    queryRaw.mockResolvedValue(rows);

    const result = await (relay as any).claimPendingMessages(25);

    expect(result).toEqual(rows);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain("FOR UPDATE SKIP LOCKED");
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain("attempts = target.attempts + 1");
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain('"lastAttemptAt" = NOW()');
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain("UPDATE outbox_messages");
    expect(sqlText(queryRaw.mock.calls[0][0])).toContain("LIMIT ");
  });

  it("triggers bootstrap drain when relay is enabled", async () => {
    const { relay } = createRelay();
    const processSpy = jest
      .spyOn(relay, "processOutbox")
      .mockResolvedValue(undefined);

    relay.onApplicationBootstrap();

    expect(processSpy).toHaveBeenCalledTimes(1);
  });

  it("skips bootstrap drain when explicitly disabled", async () => {
    const { relay } = createRelay({
      OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED: "false",
    });
    const processSpy = jest
      .spyOn(relay, "processOutbox")
      .mockResolvedValue(undefined);

    relay.onApplicationBootstrap();

    expect(processSpy).not.toHaveBeenCalled();
  });

  it("runs scheduled relay when schedule is enabled", async () => {
    const { relay } = createRelay();
    const processSpy = jest
      .spyOn(relay, "processOutbox")
      .mockResolvedValue(undefined);

    await relay.handleScheduledRelay();

    expect(processSpy).toHaveBeenCalledTimes(1);
  });

  it("skips scheduled relay when relay is disabled", async () => {
    const { relay } = createRelay({ OUTBOX_RELAY_ENABLED: "false" });
    const processSpy = jest
      .spyOn(relay, "processOutbox")
      .mockResolvedValue(undefined);

    await relay.handleScheduledRelay();

    expect(processSpy).not.toHaveBeenCalled();
  });

  it("publishes broker before local delivery in dual mode and persists both checkpoints", async () => {
    const { relay, queryRaw, brokerPublisher, eventEmitter, prisma } =
      createRelay({
        OUTBOX_DELIVERY_MODE: "dual",
      });
    queryRaw.mockResolvedValue([createMessage()]);

    await relay.processOutbox();

    expect(brokerPublisher.publish).toHaveBeenCalledTimes(1);
    expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    expect(
      brokerPublisher.publish.mock.invocationCallOrder[0],
    ).toBeLessThan(eventEmitter.emitAsync.mock.invocationCallOrder[0]);

    expect(prisma.outboxMessage.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({
          brokerDeliveredAt: expect.any(Date),
          error: null,
        }),
      }),
    );
    expect(prisma.outboxMessage.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({
          localDeliveredAt: expect.any(Date),
          error: null,
        }),
      }),
    );
    expect(prisma.outboxMessage.update).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({
          status: "PROCESSED",
          error: null,
        }),
      }),
    );
  });

  it("does not emit local event when broker delivery fails in dual mode", async () => {
    const { relay, queryRaw, brokerPublisher, eventEmitter, prisma } =
      createRelay({
        OUTBOX_DELIVERY_MODE: "dual",
      });
    queryRaw.mockResolvedValue([createMessage()]);
    brokerPublisher.publish.mockRejectedValue(new Error("broker down"));
    prisma.outboxMessage.findUnique.mockResolvedValue({ attempts: 1 });

    await relay.processOutbox();

    expect(eventEmitter.emitAsync).not.toHaveBeenCalled();
    expect(prisma.outboxMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg-1" },
        data: expect.objectContaining({
          status: "PENDING",
          error: "broker down",
          nextRetryAt: expect.any(Date),
        }),
      }),
    );
  });

  it("resumes partial delivery without republishing broker leg", async () => {
    const { relay, queryRaw, brokerPublisher, eventEmitter, prisma } =
      createRelay({
        OUTBOX_DELIVERY_MODE: "dual",
      });
    queryRaw.mockResolvedValue([
      createMessage({
        brokerDeliveredAt: new Date("2026-03-12T12:01:00.000Z"),
      }),
    ]);

    await relay.processOutbox();

    expect(brokerPublisher.publish).not.toHaveBeenCalled();
    expect(eventEmitter.emitAsync).toHaveBeenCalledTimes(1);
    expect(prisma.outboxMessage.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          localDeliveredAt: expect.any(Date),
        }),
      }),
    );
    expect(prisma.outboxMessage.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PROCESSED",
        }),
      }),
    );
  });

  it("recovers stale processing messages before claiming a new batch", async () => {
    const { relay, prisma, queryRaw } = createRelay();
    prisma.outboxMessage.updateMany.mockResolvedValue({ count: 2 });
    queryRaw.mockResolvedValue([]);

    await relay.processOutbox();

    expect(prisma.outboxMessage.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PROCESSING",
        }),
        data: expect.objectContaining({
          status: "PENDING",
        }),
      }),
    );
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it("forbids local_only mode in production without explicit override", () => {
    const build = () =>
      createRelay({
        NODE_ENV: "production",
        OUTBOX_DELIVERY_MODE: "local_only",
      });

    expect(() => build().relay.onApplicationBootstrap()).toThrow(
      /OUTBOX_DELIVERY_MODE=local_only is forbidden in production/i,
    );
  });

  it("requires broker endpoint when broker delivery is enabled", () => {
    const { relay, brokerPublisher } = createRelay({
      OUTBOX_DELIVERY_MODE: "broker_only",
    });
    brokerPublisher.isConfigured.mockReturnValue(false);

    expect(() => relay.onApplicationBootstrap()).toThrow(
      /requires OUTBOX_BROKER_ENDPOINT/i,
    );
  });

  it("surfaces transport-specific broker config hint", () => {
    const { relay, brokerPublisher } = createRelay({
      OUTBOX_DELIVERY_MODE: "broker_only",
    });
    brokerPublisher.isConfigured.mockReturnValue(false);
    brokerPublisher.requiredConfigHint.mockReturnValue(
      "OUTBOX_BROKER_REDIS_STREAM_KEY",
    );

    expect(() => relay.onApplicationBootstrap()).toThrow(
      /requires OUTBOX_BROKER_REDIS_STREAM_KEY/i,
    );
  });

  it("continues draining immediately when a full batch was claimed", async () => {
    jest.useFakeTimers();
    const { relay, queryRaw } = createRelay({
      OUTBOX_DELIVERY_MODE: "local_only",
      OUTBOX_RELAY_BATCH_SIZE: "1",
      OUTBOX_RELAY_WAKEUP_DEBOUNCE_MS: "1",
    });
    queryRaw
      .mockResolvedValueOnce([createMessage()])
      .mockResolvedValueOnce([]);
    const processSpy = jest.spyOn(relay, "processOutbox");

    await relay.processOutbox();
    jest.runOnlyPendingTimers();

    expect(processSpy).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
