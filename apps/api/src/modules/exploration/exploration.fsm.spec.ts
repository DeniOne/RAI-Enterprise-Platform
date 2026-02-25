import { ForbiddenException } from "@nestjs/common";
import { ExplorationCaseStatus } from "@rai/prisma-client";
import { ExplorationStateMachine } from "./exploration.fsm";

describe("ExplorationStateMachine", () => {
  const fsm = new ExplorationStateMachine();

  it("allows TRIAGE_OFFICER to move DRAFT -> IN_TRIAGE", () => {
    expect(
      fsm.canTransition(
        ExplorationCaseStatus.DRAFT,
        ExplorationCaseStatus.IN_TRIAGE,
        "TRIAGE_OFFICER",
      ),
    ).toBe(true);
  });

  it("blocks INITIATOR from moving DRAFT -> IN_TRIAGE", () => {
    expect(
      fsm.canTransition(
        ExplorationCaseStatus.DRAFT,
        ExplorationCaseStatus.IN_TRIAGE,
        "INITIATOR",
      ),
    ).toBe(false);
  });

  it("allows SEU_BOARD to move BOARD_REVIEW -> ACTIVE_EXPLORATION", () => {
    expect(
      fsm.canTransition(
        ExplorationCaseStatus.BOARD_REVIEW,
        ExplorationCaseStatus.ACTIVE_EXPLORATION,
        "SEU_BOARD",
      ),
    ).toBe(true);
  });

  it("blocks forbidden transition IMPLEMENTED -> ACTIVE_EXPLORATION", () => {
    expect(
      fsm.canTransition(
        ExplorationCaseStatus.IMPLEMENTED,
        ExplorationCaseStatus.ACTIVE_EXPLORATION,
        "SEU_BOARD",
      ),
    ).toBe(false);
  });

  it("throws on illegal transition validation", () => {
    expect(() =>
      fsm.validateTransition(
        ExplorationCaseStatus.BOARD_REVIEW,
        ExplorationCaseStatus.DRAFT,
        "SEU_BOARD",
      ),
    ).toThrow(ForbiddenException);
  });
});

