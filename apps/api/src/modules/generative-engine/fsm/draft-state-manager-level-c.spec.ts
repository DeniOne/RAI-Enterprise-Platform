import { DraftStateManager, GovernanceContext } from "./draft-state-manager";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { ForbiddenException } from "@nestjs/common";

/**
 * Тесты DraftStateManager — Level C FSM Extension + Governance Guards.
 *
 * КРИТИЧНО: I33 Guard доказывает, что OVERRIDE_ANALYSIS → DRAFT
 * невозможен без DivergenceRecord и justification при high risk.
 */
describe("DraftStateManager (Level C + Governance Guards)", () => {
  let fsm: DraftStateManager;

  beforeEach(() => {
    fsm = new DraftStateManager();
  });

  // ─── Level B: базовые переходы ────────────────────────────────────

  describe("Level B: GENERATED_DRAFT transitions", () => {
    it("GENERATED_DRAFT → DRAFT: разрешён для ADMIN", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.GENERATED_DRAFT,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
        ),
      ).toBe(true);
    });

    it("GENERATED_DRAFT → ARCHIVED: разрешён для AGRONOMIST", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.GENERATED_DRAFT,
          TechMapStatus.ARCHIVED,
          UserRole.AGRONOMIST,
        ),
      ).toBe(true);
    });

    it("GENERATED_DRAFT → REVIEW: запрещён", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.GENERATED_DRAFT,
          TechMapStatus.REVIEW,
          UserRole.ADMIN,
        ),
      ).toBe(false);
    });
  });

  // ─── Level C: OVERRIDE_ANALYSIS базовые переходы ──────────────────

  describe("Level C: OVERRIDE_ANALYSIS basic transitions", () => {
    it("DRAFT → OVERRIDE_ANALYSIS: разрешён (вход в анализ)", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.DRAFT,
          TechMapStatus.OVERRIDE_ANALYSIS,
          UserRole.ADMIN,
        ),
      ).toBe(true);
    });

    it("OVERRIDE_ANALYSIS → ARCHIVED: разрешён (reject)", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.ARCHIVED,
          UserRole.MANAGER,
        ),
      ).toBe(true);
    });

    it("OVERRIDE_ANALYSIS → ACTIVE: запрещён (shortcut)", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.ACTIVE,
          UserRole.ADMIN,
        ),
      ).toBe(false);
    });
  });

  // ─── I33: Governance Guard — DivergenceRecord ─────────────────────

  describe("I33: OVERRIDE_ANALYSIS → DRAFT requires DivergenceRecord", () => {
    it("БЕЗ governance context → ЗАПРЕЩЁН", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          // governance = undefined
        ),
      ).toBe(false);
    });

    it("С пустым governance context → ЗАПРЕЩЁН", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          {}, // governance без divergenceRecordId
        ),
      ).toBe(false);
    });

    it("С divergenceRecordId → РАЗРЕШЁН (low risk)", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { divergenceRecordId: "clxyz123", disScore: 0.3 },
        ),
      ).toBe(true);
    });

    it("validate() без divergenceRecordId → throws [I33]", () => {
      expect(() =>
        fsm.validate(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { disScore: 0.5 }, // нет divergenceRecordId
        ),
      ).toThrow(ForbiddenException);

      try {
        fsm.validate(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { disScore: 0.5 },
        );
      } catch (e) {
        expect((e as ForbiddenException).message).toContain("[I33]");
        expect((e as ForbiddenException).message).toContain("DivergenceRecord");
      }
    });
  });

  // ─── I33: Governance Guard — High Risk Justification ──────────────

  describe("I33: High Risk Justification Guard", () => {
    it("DIS > 0.7 БЕЗ justification → ЗАПРЕЩЁН", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { divergenceRecordId: "clxyz123", disScore: 0.85 },
        ),
      ).toBe(false);
    });

    it("DIS > 0.7 С пустой justification → ЗАПРЕЩЁН", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          {
            divergenceRecordId: "clxyz123",
            disScore: 0.85,
            justification: "   ",
          },
        ),
      ).toBe(false);
    });

    it("DIS > 0.7 С justification → РАЗРЕШЁН", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          {
            divergenceRecordId: "clxyz123",
            disScore: 0.85,
            justification:
              "Агроном подтверждает: изменение обосновано погодными условиями",
          },
        ),
      ).toBe(true);
    });

    it("DIS = 0.7 (граничное) → НЕ требует justification", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { divergenceRecordId: "clxyz123", disScore: 0.7 },
        ),
      ).toBe(true);
    });

    it("DIS = 0.71 → ТРЕБУЕТ justification", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { divergenceRecordId: "clxyz123", disScore: 0.71 },
        ),
      ).toBe(false);
    });

    it("validate() DIS > 0.7 без justification → throws [I33] с DIS", () => {
      try {
        fsm.validate(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
          { divergenceRecordId: "clxyz123", disScore: 0.9 },
        );
        fail("Должен был бросить ForbiddenException");
      } catch (e) {
        expect((e as ForbiddenException).message).toContain("[I33]");
        expect((e as ForbiddenException).message).toContain("justification");
        expect((e as ForbiddenException).message).toContain("0.9000");
      }
    });
  });

  // ─── Governance Guard: не влияет на другие переходы ────────────────

  describe("Governance Guard isolation", () => {
    it("DRAFT → OVERRIDE_ANALYSIS: НЕ требует governance", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.DRAFT,
          TechMapStatus.OVERRIDE_ANALYSIS,
          UserRole.ADMIN,
          // governance не передаём
        ),
      ).toBe(true);
    });

    it("OVERRIDE_ANALYSIS → ARCHIVED: НЕ требует governance", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.OVERRIDE_ANALYSIS,
          TechMapStatus.ARCHIVED,
          UserRole.ADMIN,
          // governance не передаём
        ),
      ).toBe(true);
    });

    it("GENERATED_DRAFT → DRAFT: НЕ затронут governance", () => {
      expect(
        fsm.canTransition(
          TechMapStatus.GENERATED_DRAFT,
          TechMapStatus.DRAFT,
          UserRole.ADMIN,
        ),
      ).toBe(true);
    });
  });

  // ─── handlesStatus ─────────────────────────────────────────────────

  describe("handlesStatus", () => {
    it("GENERATED_DRAFT → true", () => {
      expect(fsm.handlesStatus(TechMapStatus.GENERATED_DRAFT)).toBe(true);
    });
    it("OVERRIDE_ANALYSIS → true", () => {
      expect(fsm.handlesStatus(TechMapStatus.OVERRIDE_ANALYSIS)).toBe(true);
    });
    it("DRAFT → true", () => {
      expect(fsm.handlesStatus(TechMapStatus.DRAFT)).toBe(true);
    });
    it("ACTIVE → false", () => {
      expect(fsm.handlesStatus(TechMapStatus.ACTIVE)).toBe(false);
    });
  });

  // ─── getAvailableTransitions ───────────────────────────────────────

  describe("getAvailableTransitions", () => {
    it("OVERRIDE_ANALYSIS → [DRAFT, ARCHIVED]", () => {
      const transitions = fsm.getAvailableTransitions(
        TechMapStatus.OVERRIDE_ANALYSIS,
        UserRole.ADMIN,
      );
      expect(transitions).toContain(TechMapStatus.DRAFT);
      expect(transitions).toContain(TechMapStatus.ARCHIVED);
      expect(transitions).not.toContain(TechMapStatus.ACTIVE);
    });

    it("DRAFT → содержит OVERRIDE_ANALYSIS", () => {
      const transitions = fsm.getAvailableTransitions(
        TechMapStatus.DRAFT,
        UserRole.ADMIN,
      );
      expect(transitions).toContain(TechMapStatus.OVERRIDE_ANALYSIS);
    });
  });
});
