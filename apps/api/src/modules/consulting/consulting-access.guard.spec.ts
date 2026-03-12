import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@rai/prisma-client";
import { ConsultingAccessGuard } from "./consulting-access.guard";

function createHttpContext(user?: Record<string, unknown>) {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

describe("ConsultingAccessGuard", () => {
  it("разрешает strategic policy для CEO/CFO/ADMIN", () => {
    const guard = new ConsultingAccessGuard({
      getAllAndOverride: jest.fn().mockReturnValue("strategic"),
    } as unknown as Reflector);

    expect(
      guard.canActivate(
        createHttpContext({ role: UserRole.CEO, companyId: "company-1" }),
      ),
    ).toBe(true);
    expect(
      guard.canActivate(
        createHttpContext({ role: UserRole.CFO, companyId: "company-1" }),
      ),
    ).toBe(true);
  });

  it("запрещает management policy для неподходящей роли", () => {
    const guard = new ConsultingAccessGuard({
      getAllAndOverride: jest.fn().mockReturnValue("management"),
    } as unknown as Reflector);

    expect(() =>
      guard.canActivate(
        createHttpContext({ role: UserRole.MANAGER, companyId: "company-1" }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("запрещает доступ без аутентифицированного user context", () => {
    const guard = new ConsultingAccessGuard({
      getAllAndOverride: jest.fn().mockReturnValue("strategic"),
    } as unknown as Reflector);

    expect(() => guard.canActivate(createHttpContext())).toThrow(
      ForbiddenException,
    );
  });
});
