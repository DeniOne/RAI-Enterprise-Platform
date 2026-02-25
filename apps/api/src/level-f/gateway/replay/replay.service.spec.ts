import { ReplayService } from "./replay.service";

describe("ReplayService", () => {
  const service = new ReplayService();

  it("is deterministic for payloads with different key order", async () => {
    const a = { traceId: "T1", nested: { b: 2, a: 1 }, amount: 10 };
    const b = { amount: 10, nested: { a: 1, b: 2 }, traceId: "T1" };

    const firstSeed = await service.verifyReplay("invalid", a);
    const second = await service.verifyReplay(firstSeed.replayedHash, b);

    expect(firstSeed.replayedHash).toBe(second.replayedHash);
    expect(second.isMatch).toBe(true);
  });

  it("returns mismatch when recorded hash differs from replayed hash", async () => {
    const result = await service.verifyReplay("deadbeef", {
      traceId: "T1",
      value: 1,
    });
    expect(result.isMatch).toBe(false);
    expect(result.replayedHash).toHaveLength(64);
  });
});
