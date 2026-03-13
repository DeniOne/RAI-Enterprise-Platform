import { OutboxWakeupService } from "./outbox-wakeup.service";

describe("OutboxWakeupService", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("publishes wakeup hint to Redis pub/sub channel", async () => {
    const redisService = {
      isReady: jest.fn().mockReturnValue(true),
      publish: jest.fn().mockResolvedValue(1),
    };
    const service = new OutboxWakeupService(redisService as any);

    await service.publishHint({
      reason: "event_persisted",
      eventType: "task.created",
      companyId: "company-1",
      count: 1,
    });

    expect(redisService.publish).toHaveBeenCalledWith(
      "rai:outbox:wakeup",
      expect.stringContaining('"reason":"event_persisted"'),
    );
  });

  it("subscribes to wakeup channel and parses incoming hints", async () => {
    let handler: ((message: string) => Promise<void>) | null = null;
    const redisService = {
      isReady: jest.fn().mockReturnValue(true),
      publish: jest.fn(),
      subscribe: jest
        .fn()
        .mockImplementation(async (_channel: string, callback: any) => {
          handler = async (message: string) => callback(message, _channel);
          return async () => undefined;
        }),
    };
    const service = new OutboxWakeupService(redisService as any);
    const received: any[] = [];

    await service.subscribe(async (hint) => {
      received.push(hint);
    });

    await handler?.(
      JSON.stringify({
        reason: "batch_persisted",
        eventType: "finance.reconciliation.alert",
        companyId: "company-1",
        count: 2,
        emittedAt: "2026-03-12T20:00:00.000Z",
      }),
    );

    expect(received).toEqual([
      {
        reason: "batch_persisted",
        eventType: "finance.reconciliation.alert",
        companyId: "company-1",
        count: 2,
        emittedAt: "2026-03-12T20:00:00.000Z",
      },
    ]);
  });
});
