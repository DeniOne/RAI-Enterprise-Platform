import { Test, TestingModule } from "@nestjs/testing";
import { UserRole } from "@rai/prisma-client";
import { RiskPolicyEngineService } from "./risk-policy-engine.service";

describe("RiskPolicyEngineService", () => {
  let service: RiskPolicyEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RiskPolicyEngineService],
    }).compile();
    service = module.get(RiskPolicyEngineService);
  });

  it("READ → ALLOWED для любого domain и role", () => {
    expect(service.evaluate("READ", "agro", undefined)).toBe("ALLOWED");
    expect(service.evaluate("READ", "finance", UserRole.AGRONOMIST)).toBe("ALLOWED");
    expect(service.evaluate("READ", "risk", UserRole.USER)).toBe("ALLOWED");
  });

  it("CRITICAL → REQUIRES_TWO_PERSON_APPROVAL", () => {
    expect(service.evaluate("CRITICAL", "agro", UserRole.ADMIN)).toBe("REQUIRES_TWO_PERSON_APPROVAL");
    expect(service.evaluate("CRITICAL", "finance", UserRole.CEO)).toBe("REQUIRES_TWO_PERSON_APPROVAL");
  });

  it("WRITE agro + agronomist → REQUIRES_USER_CONFIRMATION", () => {
    expect(service.evaluate("WRITE", "agro", UserRole.AGRONOMIST)).toBe("REQUIRES_USER_CONFIRMATION");
    expect(service.evaluate("WRITE", "agro", UserRole.MANAGER)).toBe("REQUIRES_USER_CONFIRMATION");
  });

  it("WRITE agro + operator → REQUIRES_USER_CONFIRMATION", () => {
    expect(service.evaluate("WRITE", "agro", UserRole.USER)).toBe("REQUIRES_USER_CONFIRMATION");
  });

  it("WRITE finance → REQUIRES_DIRECTOR_CONFIRMATION", () => {
    expect(service.evaluate("WRITE", "finance", UserRole.AGRONOMIST)).toBe("REQUIRES_DIRECTOR_CONFIRMATION");
    expect(service.evaluate("WRITE", "finance", UserRole.CFO)).toBe("REQUIRES_DIRECTOR_CONFIRMATION");
  });

  it("WRITE risk → REQUIRES_USER_CONFIRMATION", () => {
    expect(service.evaluate("WRITE", "risk", undefined)).toBe("REQUIRES_USER_CONFIRMATION");
  });

  it("isDirector", () => {
    expect(service.isDirector(UserRole.CEO)).toBe(true);
    expect(service.isDirector(UserRole.CFO)).toBe(true);
    expect(service.isDirector(UserRole.ADMIN)).toBe(true);
    expect(service.isDirector(UserRole.AGRONOMIST)).toBe(false);
    expect(service.isDirector(undefined)).toBe(false);
  });
});
