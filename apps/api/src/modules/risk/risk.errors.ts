export class RiskBlockedError extends Error {
  constructor(public assessment: any) {
    super(
      `Action blocked by Risk Engine. Verdict: ${assessment.verdict}. FSM State: ${assessment.explanation.fsmState}`,
    );
    this.name = "RiskBlockedError";
  }
}
