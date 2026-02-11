import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { CreateTechnologyCardInput } from "./dto/create-technology-card.input";
import { TechnologyCard, Prisma, User } from "@rai/prisma-client";

@Injectable()
export class TechnologyCardService {
  constructor(private readonly prisma: PrismaService) { }

  async create(
    input: CreateTechnologyCardInput,
    user: User,
    companyId: string,
  ): Promise<any> {
    return this.prisma.technologyCard.create({
      data: {
        name: input.name,
        description: input.description,
        companyId,
        operations: {
          create: input.operations?.map((op) => ({
            name: op.name,
            sequence: op.sequence,
            stageId: op.stageId,
            description: op.description,
            resources: {
              create: op.resources?.map((res) => ({
                type: res.type,
                name: res.name,
                dosage: res.dosage,
                unit: res.unit,
              })),
            },
          })),
        },
      },
      include: {
        operations: {
          include: {
            resources: true,
          },
        },
      },
    });
  }

  async findAll(companyId: string): Promise<any[]> {
    return this.prisma.technologyCard.findMany({
      where: { companyId },
      include: {
        operations: {
          orderBy: { sequence: "asc" },
          include: { resources: true },
        },
      },
    });
  }

  async findOne(id: string, companyId: string): Promise<any> {
    const card = await this.prisma.technologyCard.findFirst({
      where: { id, companyId },
      include: {
        operations: {
          orderBy: { sequence: "asc" },
          include: { resources: true },
        },
      },
    });

    if (!card) {
      throw new NotFoundException(`TechnologyCard ${id} not found`);
    }

    return card;
  }

  /**
   * Links a technology card to a season.
   */
  async applyToSeason(
    seasonId: string,
    cardId: string,
    user: User,
    companyId: string,
  ): Promise<any> {
    const season = await this.prisma.season.findFirst({
      where: { id: seasonId, companyId },
    });

    if (!season) {
      throw new NotFoundException(`Season ${seasonId} not found`);
    }

    const card = await this.prisma.technologyCard.findFirst({
      where: { id: cardId, companyId },
    });

    if (!card) {
      throw new NotFoundException(`TechnologyCard ${cardId} not found`);
    }

    return this.prisma.season.update({
      where: { id: seasonId },
      data: {
        technologyCardId: cardId,
      },
      include: {
        technologyCard: {
          include: {
            operations: {
              orderBy: { sequence: "asc" },
              include: { resources: true },
            },
          },
        },
      },
    });
  }
}
