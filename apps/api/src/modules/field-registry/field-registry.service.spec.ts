import { Test, TestingModule } from "@nestjs/testing";
import { FieldRegistryService } from "./field-registry.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SoilType } from "@prisma/client";

describe("FieldRegistryService", () => {
  let service: FieldRegistryService;

  const prismaMock = {
    client: {
      findFirst: jest.fn(),
    },
    field: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldRegistryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<FieldRegistryService>(FieldRegistryService);
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should throw ForbiddenException if client does not belong to company", async () => {
      prismaMock.client.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          {
            cadastreNumber: "123",
            area: 10,
            coordinates: {
              type: "Polygon",
              coordinates: [
                [
                  [0, 0],
                  [0, 1],
                  [1, 1],
                  [1, 0],
                  [0, 0],
                ],
              ],
            },
            soilType: SoilType.CHERNOZEM,
            clientId: "client-1",
            companyId: "company-1",
          },
          "company-1",
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw BadRequestException for invalid GeoJSON", async () => {
      prismaMock.client.findFirst.mockResolvedValue({
        id: "client-1",
        companyId: "company-1",
      });

      await expect(
        service.create(
          {
            cadastreNumber: "123",
            area: 10,
            coordinates: { type: "Point", coordinates: [0, 0] }, // Invalid type (must be Polygon/MultiPolygon)
            soilType: SoilType.CHERNOZEM,
            clientId: "client-1",
            companyId: "company-1",
          },
          "company-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("should create field if all valid", async () => {
      prismaMock.client.findFirst.mockResolvedValue({
        id: "client-1",
        companyId: "company-1",
      });
      prismaMock.field.create.mockResolvedValue({ id: "field-1" });

      const data = {
        cadastreNumber: "123",
        area: 10,
        coordinates: {
          type: "Polygon",
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0],
            ],
          ],
        },
        soilType: SoilType.CHERNOZEM,
        clientId: "client-1",
        companyId: "company-1",
      };

      const result = await service.create(data, "company-1");

      expect(prismaMock.field.create).toHaveBeenCalled();
      expect(result).toEqual({ id: "field-1" });
    });
  });

  describe("findAll", () => {
    it("should list fields only for specified company", async () => {
      const mockFields = [{ id: "f1", companyId: "c1" }];
      prismaMock.field.findMany.mockResolvedValue(mockFields);

      const result = await service.findAll("c1");

      expect(prismaMock.field.findMany).toHaveBeenCalledWith({
        where: { companyId: "c1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockFields);
    });
  });
});
