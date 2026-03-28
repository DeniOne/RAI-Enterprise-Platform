import { TenantIdentityResolverService } from "./tenant-identity-resolver.service";

describe("TenantIdentityResolverService", () => {
  it("returns actual tenantId from active binding when token carries companyId fallback", async () => {
    const service = new TenantIdentityResolverService();
    (service as any).prisma = {
      tenantCompanyBinding: {
        findFirst: jest.fn().mockResolvedValue({ tenantId: "tenant-1" }),
      },
      tenantState: {
        findUnique: jest.fn(),
      },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    await expect(
      service.resolveTenantId("company-1", "company-1"),
    ).resolves.toBe("tenant-1");
  });

  it("keeps explicit tenantId when token already carries tenant boundary", async () => {
    const service = new TenantIdentityResolverService();
    (service as any).prisma = {
      tenantCompanyBinding: {
        findFirst: jest.fn(),
      },
      tenantState: {
        findUnique: jest.fn(),
      },
      $disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    await expect(
      service.resolveTenantId("company-1", "tenant-explicit"),
    ).resolves.toBe("tenant-explicit");
  });
});
