import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { CreateCommerceContractDto } from "../dto/create-commerce-contract.dto";

@Injectable()
export class CommerceContractService {
  constructor(private readonly prisma: PrismaService) {}

  async createContract(dto: CreateCommerceContractDto) {
    const uniqueRoleKeys = new Set<string>();
    for (const role of dto.roles) {
      const key = `${role.partyId}:${role.role}`;
      if (uniqueRoleKeys.has(key)) {
        throw new BadRequestException(`Duplicate contract role: ${key}`);
      }
      uniqueRoleKeys.add(key);
    }

    const parties = await this.prisma.party.findMany({
      where: { id: { in: dto.roles.map((r) => r.partyId) } },
      select: { id: true, companyId: true },
    });

    if (parties.length !== dto.roles.length) {
      throw new BadRequestException("One or more parties do not exist");
    }

    return this.prisma.commerceContract.create({
      data: {
        number: dto.number,
        type: dto.type,
        validFrom: new Date(dto.validFrom),
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        jurisdictionId: dto.jurisdictionId,
        regulatoryProfileId: dto.regulatoryProfileId,
        roles: {
          create: dto.roles.map((role) => ({
            partyId: role.partyId,
            role: role.role,
            isPrimary: role.isPrimary ?? false,
          })),
        },
      },
      include: { roles: true },
    });
  }

  async createObligation(contractId: string, type: "DELIVER" | "PAY" | "PERFORM", dueDate?: Date) {
    const contract = await this.prisma.commerceContract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new BadRequestException("Contract not found");
    }

    return this.prisma.commerceObligation.create({
      data: {
        contractId,
        type,
        dueDate: dueDate ?? null,
      },
    });
  }
}
