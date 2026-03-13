import { FrontOfficeMetricsService } from "./front-office-metrics.service";

describe("FrontOfficeMetricsService", () => {
  let service: FrontOfficeMetricsService;

  beforeEach(() => {
    service = new FrontOfficeMetricsService();
    service.resetForTests();
  });

  it("tracks intake outcomes, clarification depth and delivery failures", () => {
    service.recordRoutingOutcome("c1", "PROCESS_DRAFT");
    service.recordRoutingOutcome("c1", "REQUEST_CLARIFICATION");
    service.recordClarificationRequest("c1", "thread-1");
    service.recordClarificationRequest("c1", "thread-1");
    service.recordReplyStatus("c1", "FAILED");
    service.recordReplyStatus("c1", "SENT");

    const snapshot = service.snapshot("c1");
    expect(snapshot.outcomes.PROCESS_DRAFT).toBe(1);
    expect(snapshot.outcomes.REQUEST_CLARIFICATION).toBe(1);
    expect(snapshot.clarification.maxDepth).toBe(2);
    expect(snapshot.delivery.deliveryFailuresTotal).toBe(1);
    expect(snapshot.delivery.repliesSentTotal).toBe(1);
  });

  it("tracks handoff latency on completion and exports prometheus format", () => {
    service.recordHandoffCreated("c1", "h-1", "2026-03-13T00:00:00.000Z");
    service.recordHandoffCreated("c1", "h-2", "2026-03-13T00:00:10.000Z");
    service.recordHandoffResolved("c1", "h-1", "2026-03-13T00:00:30.000Z");
    service.recordHandoffResolved("c1", "h-2", "2026-03-13T00:01:10.000Z");

    const snapshot = service.snapshot("c1");
    expect(snapshot.handoff.createdTotal).toBe(2);
    expect(snapshot.handoff.resolvedTotal).toBe(2);
    expect(snapshot.handoff.openTotal).toBe(0);
    expect(snapshot.handoff.latencyMs.count).toBe(2);
    expect(snapshot.handoff.latencyMs.avg).toBe(45000);
    expect(snapshot.handoff.latencyMs.p95).toBe(60000);

    const prometheus = service.prometheus("c1");
    expect(prometheus).toContain('front_office_intake_outcomes_total{mode="AUTO_REPLY"}');
    expect(prometheus).toContain("front_office_handoff_latency_ms_p95 60000");
  });
});

