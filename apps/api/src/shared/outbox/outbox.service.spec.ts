import { OutboxService } from "./outbox.service";

describe("OutboxService tenant contract", () => {
  let service: OutboxService;

  beforeEach(() => {
    service = new OutboxService();
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
});
