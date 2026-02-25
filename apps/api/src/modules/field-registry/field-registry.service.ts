import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { Field } from "@rai/prisma-client";
import { CreateFieldDto } from "./dto/create-field.dto";

@Injectable()
export class FieldRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFieldDto, companyId: string): Promise<Field> {
    // 1. Verify Account belongs to Company
    const account = await this.prisma.account.findFirst({
      where: { id: data.accountId, companyId },
    });

    if (!account) {
      throw new ForbiddenException(
        `Account ${data.accountId} not found or access denied`,
      );
    }

    // 2. GeoJSON Validation (Strictly Polygon or MultiPolygon)
    this.validateGeoJson(data.coordinates);

    // 3. Create Field with explicit isolation check
    return this.prisma.field.create({
      data: {
        cadastreNumber: data.cadastreNumber,
        name: data.name,
        area: data.area,
        coordinates: data.coordinates,
        soilType: data.soilType,
        clientId: data.accountId,
        companyId, // Explicitly linking to company
        status: "ACTIVE",
      },
    });
  }

  async findAll(companyId: string): Promise<Field[]> {
    return this.prisma.field.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }

  private validateGeoJson(geojson: any) {
    if (!geojson || typeof geojson !== "object") {
      throw new BadRequestException("Invalid GeoJSON object");
    }
    if (geojson.type !== "Polygon" && geojson.type !== "MultiPolygon") {
      throw new BadRequestException(
        "Only Polygon or MultiPolygon GeoJSON is allowed",
      );
    }
    if (!Array.isArray(geojson.coordinates)) {
      throw new BadRequestException("GeoJSON coordinates must be an array");
    }

    // Basic structural check for Polygon
    if (geojson.type === "Polygon") {
      if (
        geojson.coordinates.length === 0 ||
        !Array.isArray(geojson.coordinates[0])
      ) {
        throw new BadRequestException("Invalid Polygon coordinates structure");
      }
    }
  }
}
