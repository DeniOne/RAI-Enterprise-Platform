import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  CropVarietyCreateDto,
  CropVarietyUpdateDto,
} from "./dto/crop-variety.dto";

@Injectable()
export class CropVarietyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CropVarietyCreateDto, companyId: string) {
    const existing = await (this.prisma as any).cropVariety.findFirst({
      where: {
        name: dto.name,
        cropType: dto.cropType,
        companyId,
        isLatest: true,
      },
    });

    if (existing) {
      throw new ConflictException("CropVariety with this name already exists");
    }

    return (this.prisma as any).cropVariety.create({
      data: {
        ...dto,
        companyId,
        version: 1,
        isLatest: true,
      },
    });
  }

  async update(dto: CropVarietyUpdateDto, companyId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const current = await (tx as any).cropVariety.findFirst({
        where: { id: dto.id, companyId },
      });

      if (!current) {
        throw new NotFoundException("CropVariety not found");
      }
      if (!current.isLatest) {
        throw new BadRequestException("Only latest version can be updated");
      }

      await (tx as any).cropVariety.update({
        where: { id: current.id },
        data: { isLatest: false },
      });

      const { id, changeReason, ...patch } = dto;
      const next = await (tx as any).cropVariety.create({
        data: {
          ...current,
          ...patch,
          id: undefined,
          version: current.version + 1,
          isLatest: true,
        },
      });

      await (tx as any).cropVarietyHistory.create({
        data: {
          cropVarietyId: next.id,
          version: next.version,
          changeReason: changeReason ?? "Update",
          changedBy: userId,
          snapshot: next,
        },
      });

      return next;
    });
  }

  async findAll(companyId: string) {
    return (this.prisma as any).cropVariety.findMany({
      where: { companyId, isLatest: true },
      orderBy: { name: "asc" },
    });
  }

  async getHistory(name: string, companyId: string) {
    return (this.prisma as any).cropVariety.findMany({
      where: { name, companyId },
      orderBy: { version: "desc" },
    });
  }

  async getVarietiesByCropType(cropType: string, companyId: string) {
    return (this.prisma as any).cropVariety.findMany({
      where: {
        cropType,
        companyId,
        isLatest: true,
      },
      orderBy: { name: "asc" },
    });
  }
}
