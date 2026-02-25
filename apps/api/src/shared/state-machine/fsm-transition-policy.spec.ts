import {
  assertTransitionAllowed,
  isTransitionAllowed,
} from "./fsm-transition-policy";
import { InvalidTransitionError } from "./state-machine.interface";

describe("FSM transition policy registry", () => {
  it("allows valid task transitions", () => {
    expect(isTransitionAllowed("TASK", "PENDING", "START")).toBe(true);
    expect(isTransitionAllowed("TASK", "IN_PROGRESS", "COMPLETE")).toBe(true);
  });

  it("blocks invalid task transitions", () => {
    expect(isTransitionAllowed("TASK", "COMPLETED", "START")).toBe(false);
    expect(() => assertTransitionAllowed("TASK", "COMPLETED", "START")).toThrow(
      InvalidTransitionError,
    );
  });

  it("allows valid budget transitions", () => {
    expect(isTransitionAllowed("BUDGET", "DRAFT", "APPROVE")).toBe(true);
    expect(isTransitionAllowed("BUDGET", "ACTIVE", "BLOCK")).toBe(true);
  });

  it("blocks invalid budget transitions", () => {
    expect(isTransitionAllowed("BUDGET", "APPROVED", "CLOSE")).toBe(false);
    expect(() =>
      assertTransitionAllowed("BUDGET", "APPROVED", "CLOSE"),
    ).toThrow(InvalidTransitionError);
  });
});
