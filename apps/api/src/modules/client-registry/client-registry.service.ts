import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { Account, Holding, Prisma } from "@rai/prisma-client";

@Injectable()
export class ClientRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Holdings ---

  async createHolding(
    data: { name: string; description?: string },
    companyId: string,
  ): Promise<Holding> {
    return this.prisma.holding.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findAllHoldings(companyId: string): Promise<Holding[]> {
    return this.prisma.holding.findMany({
      where: { companyId },
      include: { accounts: true },
    });
  }

  async findOneHolding(id: string, companyId: string): Promise<Holding> {
    const holding = await this.prisma.holding.findFirst({
      where: { id, companyId },
      include: { accounts: true },
    });

    if (!holding) {
      throw new NotFoundException(`Holding ${id} not found or access denied`);
    }

    return holding;
  }

  async deleteHolding(id: string, companyId: string): Promise<void> {
    await this.findOneHolding(id, companyId);

    // Architectural Constraint: Cannot delete holding with active accounts
    const accountsCount = await this.prisma.account.count({
      where: { holdingId: id },
    });

    if (accountsCount > 0) {
      throw new ConflictException(
        `Cannot delete holding ${id} because it has active accounts linked to it`,
      );
    }

    await this.prisma.holding.delete({
      where: { id },
    });
  }

  // --- Accounts ---

  async updateAccountHolding(
    accountId: string,
    holdingId: string | null,
    companyId: string,
  ): Promise<Account> {
    // 1. Verify Account belongs to Company
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) {
      throw new NotFoundException(
        `Account ${accountId} not found or access denied`,
      );
    }

    // 2. Verify Holding belongs to Company (if provided)
    if (holdingId) {
      const holding = await this.prisma.holding.findFirst({
        where: { id: holdingId, companyId },
      });

      if (!holding) {
        throw new ForbiddenException(
          `Holding ${holdingId} does not belong to your company`,
        );
      }
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { holdingId },
    });
  }

  async findAccountsByHolding(
    holdingId: string,
    companyId: string,
  ): Promise<Account[]> {
    await this.findOneHolding(holdingId, companyId); // Validate existence and access

    return this.prisma.account.findMany({
      where: { holdingId, companyId },
    });
  }
}
