import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { Holding, Client } from "@prisma/client";

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
      include: { clients: true },
    });
  }

  async findOneHolding(id: string, companyId: string): Promise<Holding> {
    const holding = await this.prisma.holding.findFirst({
      where: { id, companyId },
      include: { clients: true },
    });

    if (!holding) {
      throw new NotFoundException(`Holding ${id} not found or access denied`);
    }

    return holding;
  }

  async deleteHolding(id: string, companyId: string): Promise<void> {
    await this.findOneHolding(id, companyId);

    // Architectural Constraint: Cannot delete holding with active clients
    const clientsCount = await this.prisma.client.count({
      where: { holdingId: id },
    });

    if (clientsCount > 0) {
      throw new ConflictException(
        `Cannot delete holding ${id} because it has active clients linked to it`,
      );
    }

    await this.prisma.holding.delete({
      where: { id },
    });
  }

  // --- Clients ---

  async updateClientHolding(
    clientId: string,
    holdingId: string | null,
    companyId: string,
  ): Promise<Client> {
    // 1. Verify Client belongs to Company
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, companyId },
    });

    if (!client) {
      throw new NotFoundException(
        `Client ${clientId} not found or access denied`,
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

    return this.prisma.client.update({
      where: { id: clientId },
      data: { holdingId },
    });
  }

  async findClientsByHolding(
    holdingId: string,
    companyId: string,
  ): Promise<Client[]> {
    await this.findOneHolding(holdingId, companyId); // Validate existence and access

    return this.prisma.client.findMany({
      where: { holdingId, companyId },
    });
  }
}
