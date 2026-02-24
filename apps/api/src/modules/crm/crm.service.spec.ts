import { BadRequestException } from "@nestjs/common";
import { CrmService } from "./crm.service";

describe("CrmService hierarchy validation", () => {
  it("blocks account freeze when no linked fields", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: "acc-1", holdingId: null, status: "ACTIVE" }),
        update: jest.fn(),
      },
      field: {
        count: jest.fn().mockResolvedValue(0),
      },
      holding: {
        findFirst: jest.fn(),
      },
    };

    const service = new CrmService(prismaMock);

    await expect(
      service.updateAccountProfile("acc-1", "company-1", { status: "FROZEN" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows account freeze when linked fields exist", async () => {
    const prismaMock: any = {
      account: {
        findFirst: jest.fn().mockResolvedValue({ id: "acc-1", holdingId: null, status: "ACTIVE" }),
        update: jest.fn().mockResolvedValue({ id: "acc-1", status: "FROZEN" }),
      },
      field: {
        count: jest.fn().mockResolvedValue(2),
      },
      holding: {
        findFirst: jest.fn(),
      },
    };

    const service = new CrmService(prismaMock);

    await expect(
      service.updateAccountProfile("acc-1", "company-1", { status: "FROZEN" }),
    ).resolves.toMatchObject({ id: "acc-1", status: "FROZEN" });
  });
});

