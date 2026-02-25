import { Test, TestingModule } from "@nestjs/testing";
import { TechMapStateMachine, TransitionRequest } from "./tech-map.fsm";
import { TechMapStatus, UserRole } from "@rai/prisma-client";
import { ForbiddenException } from "@nestjs/common";

describe("TechMapStateMachine", () => {
  let fsm: TechMapStateMachine;
  const userId = "user-1";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TechMapStateMachine],
    }).compile();

    fsm = module.get<TechMapStateMachine>(TechMapStateMachine);
  });

  describe("Happy Paths", () => {
    it("Manager can move DRAFT -> REVIEW", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.DRAFT,
        targetStatus: TechMapStatus.REVIEW,
        userRole: UserRole.MANAGER,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(true);
      expect(() => fsm.validate(req)).not.toThrow();
    });

    it("Agronomist can move REVIEW -> APPROVED", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.REVIEW,
        targetStatus: TechMapStatus.APPROVED,
        userRole: UserRole.AGRONOMIST,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(true);
    });

    it("CEO can move APPROVED -> ACTIVE", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.APPROVED,
        targetStatus: TechMapStatus.ACTIVE,
        userRole: UserRole.CEO,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(true);
    });

    it("Admin can move ACTIVE -> ARCHIVED", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.ACTIVE,
        targetStatus: TechMapStatus.ARCHIVED,
        userRole: UserRole.ADMIN,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(true);
    });
  });

  describe("RBAC Failures", () => {
    it("Field Worker CANNOT move APPROVED -> ACTIVE", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.APPROVED,
        targetStatus: TechMapStatus.ACTIVE,
        userRole: UserRole.FIELD_WORKER,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(false);
      expect(() => fsm.validate(req)).toThrow(ForbiddenException);
    });

    it("Manager CANNOT move APPROVED -> ACTIVE (CEO/Admin only)", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.APPROVED,
        targetStatus: TechMapStatus.ACTIVE,
        userRole: UserRole.MANAGER,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(false);
    });
  });

  describe("Illegal Transitions", () => {
    it("Cannot skip statuses (DRAFT -> ACTIVE)", () => {
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.DRAFT,
        targetStatus: TechMapStatus.ACTIVE,
        userRole: UserRole.ADMIN,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(false);
    });

    it("Cannot go back from ACTIVE -> DRAFT", () => {
      // Unless specifically allowed? StateMachine code says default false.
      const req: TransitionRequest = {
        currentStatus: TechMapStatus.ACTIVE,
        targetStatus: TechMapStatus.DRAFT,
        userRole: UserRole.ADMIN,
        userId,
      };
      expect(fsm.canTransition(req)).toBe(false);
    });
  });
});
