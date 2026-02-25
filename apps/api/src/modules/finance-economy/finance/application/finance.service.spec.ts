import { ConflictException, NotFoundException } from "@nestjs/common";
import { FinanceService } from "./finance.service";

describe("FinanceService optimistic locking", () => {
  const makeService = () => {
    const prisma = {
      cashAccount: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
    } as any;
    const service = new FinanceService(prisma);
    return { service, prisma };
  };

  it("throws NotFound when account is missing", async () => {
    const { service, prisma } = makeService();
    prisma.cashAccount.findFirst.mockResolvedValue(null);

    await expect(
      service.updateBalance("acc-1", 100, "c1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws ConflictException on version mismatch", async () => {
    const { service, prisma } = makeService();
    prisma.cashAccount.findFirst.mockResolvedValue({
      id: "acc-1",
      companyId: "c1",
      version: 2,
    });
    prisma.cashAccount.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateBalance("acc-1", 100, "c1"),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("increments version and returns updated account", async () => {
    const { service, prisma } = makeService();
    prisma.cashAccount.findFirst.mockResolvedValue({
      id: "acc-1",
      companyId: "c1",
      version: 2,
    });
    prisma.cashAccount.updateMany.mockResolvedValue({ count: 1 });
    prisma.cashAccount.findFirstOrThrow.mockResolvedValue({
      id: "acc-1",
      version: 3,
    });

    const result = await service.updateBalance("acc-1", 100, "c1");

    expect(prisma.cashAccount.updateMany).toHaveBeenCalledWith({
      where: { id: "acc-1", companyId: "c1", version: 2 },
      data: {
        balance: { increment: 100 },
        version: { increment: 1 },
      },
    });
    expect(result).toEqual({ id: "acc-1", version: 3 });
  });
});
