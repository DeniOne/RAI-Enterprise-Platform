import { DraftStateManager } from "./draft-state-manager";
import { TechMapStatus, UserRole } from "@rai/prisma-client";

describe("DraftStateManager", () => {
  let manager: DraftStateManager;

  beforeEach(() => {
    manager = new DraftStateManager();
  });

  describe("handlesStatus", () => {
    it("должен возвращать true для GENERATED_DRAFT", () => {
      expect(manager.handlesStatus(TechMapStatus.GENERATED_DRAFT)).toBe(true);
    });

    it("должен возвращать false для других статусов", () => {
      expect(manager.handlesStatus(TechMapStatus.DRAFT)).toBe(false);
      expect(manager.handlesStatus(TechMapStatus.ACTIVE)).toBe(false);
    });
  });

  it("должен возвращать DRAFT и ARCHIVED для GENERATED_DRAFT", () => {
    const targets = manager.getAvailableTransitions(
      TechMapStatus.GENERATED_DRAFT,
      UserRole.AGRONOMIST,
    );

    expect(targets).toContain(TechMapStatus.DRAFT);
    expect(targets).toContain(TechMapStatus.ARCHIVED);
    expect(targets.length).toBe(2);
  });

  describe("canTransition", () => {
    it("должен разрешать переход в DRAFT при участии человека (I17)", () => {
      const allowed = manager.canTransition(
        TechMapStatus.GENERATED_DRAFT,
        TechMapStatus.DRAFT,
        UserRole.AGRONOMIST,
      );
      expect(allowed).toBe(true);
    });

    it("должен разрешать переход в ARCHIVED (reject)", () => {
      const allowed = manager.canTransition(
        TechMapStatus.GENERATED_DRAFT,
        TechMapStatus.ARCHIVED,
        UserRole.AGRONOMIST,
      );
      expect(allowed).toBe(true);
    });

    it("должен ЗАПРЕЩАТЬ переход в REVIEW напрямую", () => {
      const allowed = manager.canTransition(
        TechMapStatus.GENERATED_DRAFT,
        TechMapStatus.REVIEW,
        UserRole.AGRONOMIST,
      );
      expect(allowed).toBe(false);
    });

    it("должен ЗАПРЕЩАТЬ переход в ACTIVE напрямую", () => {
      const allowed = manager.canTransition(
        TechMapStatus.GENERATED_DRAFT,
        TechMapStatus.ACTIVE,
        UserRole.AGRONOMIST,
      );
      expect(allowed).toBe(false);
    });

    it("должен ЗАПРЕЩАТЬ переходы если роль SYSTEM/AI (I17)", () => {
      const allowed = manager.canTransition(
        TechMapStatus.GENERATED_DRAFT,
        TechMapStatus.DRAFT,
        "SYSTEM" as any,
      );
      expect(allowed).toBe(false);
    });
  });
});
