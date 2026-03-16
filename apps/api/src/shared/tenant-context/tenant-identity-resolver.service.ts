import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@rai/prisma-client";

type TenantLookupClient = Pick<
  PrismaClient,
  "$disconnect" | "tenantCompanyBinding" | "tenantState"
>;

@Injectable()
export class TenantIdentityResolverService implements OnModuleDestroy {
  private readonly prisma: TenantLookupClient;
  private readonly cache = new Map<string, string>();

  constructor() {
    this.prisma = new PrismaClient();
  }

  async resolveTenantId(
    companyId: string,
    candidateTenantId?: string | null,
  ): Promise<string> {
    const normalizedCompanyId = String(companyId || "").trim();
    if (!normalizedCompanyId) {
      return String(candidateTenantId || "").trim() || normalizedCompanyId;
    }

    const normalizedCandidate = String(candidateTenantId || "").trim();
    if (normalizedCandidate && normalizedCandidate !== normalizedCompanyId) {
      return normalizedCandidate;
    }

    const cached = this.cache.get(normalizedCompanyId);
    if (cached) {
      return cached;
    }

    const binding = await this.prisma.tenantCompanyBinding.findFirst({
      where: {
        companyId: normalizedCompanyId,
        isActive: true,
      },
      orderBy: [{ isPrimary: "desc" }, { boundAt: "asc" }],
      select: {
        tenantId: true,
      },
    });

    if (binding?.tenantId) {
      this.cache.set(normalizedCompanyId, binding.tenantId);
      return binding.tenantId;
    }

    const tenantState = await this.prisma.tenantState.findUnique({
      where: {
        companyId: normalizedCompanyId,
      },
      select: {
        tenantId: true,
      },
    });

    if (tenantState?.tenantId) {
      this.cache.set(normalizedCompanyId, tenantState.tenantId);
      return tenantState.tenantId;
    }

    return normalizedCandidate || normalizedCompanyId;
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
