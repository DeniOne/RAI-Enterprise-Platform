import { PrismaService } from "./prisma.service";

describe("PrismaService tenant middleware", () => {
  const originalMode = process.env.TENANT_MIDDLEWARE_MODE;
  const originalCohort = process.env.TENANT_ENFORCE_COHORT;

  afterEach(() => {
    process.env.TENANT_MIDDLEWARE_MODE = originalMode;
    process.env.TENANT_ENFORCE_COHORT = originalCohort;
    jest.restoreAllMocks();
  });

  async function bootstrap(mode: "shadow" | "enforce") {
    process.env.TENANT_MIDDLEWARE_MODE = mode;
    const service = new PrismaService() as any;

    let middleware: ((params: any, next: (params: any) => Promise<any>) => Promise<any>) | null = null;
    service.$use = jest.fn((fn: any) => {
      middleware = fn;
    });
    service.$connect = jest.fn().mockResolvedValue(undefined);

    await service.onModuleInit();
    if (!middleware) {
      throw new Error("middleware not registered");
    }

    return { service, middleware };
  }

  it("blocks cross-tenant query without companyId in enforce mode", async () => {
    const { middleware } = await bootstrap("enforce");

    await expect(
      middleware!(
        {
          model: "Task",
          action: "findMany",
          args: { where: { status: "PENDING" } },
        },
        async () => [],
      ),
    ).rejects.toThrow(/missing companyId contract/i);
  });

  it("allows tenant-scoped query with companyId in enforce mode", async () => {
    const { middleware } = await bootstrap("enforce");
    const next = jest.fn().mockResolvedValue([{ id: "t1" }]);

    const result = await middleware!(
      {
        model: "Task",
        action: "findMany",
        args: { where: { companyId: "c1", status: "PENDING" } },
      },
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "t1" }]);
  });

  it("blocks raw SQL actions in enforce mode (raw SQL bypass negative test)", async () => {
    const { middleware } = await bootstrap("enforce");

    await expect(
      middleware!(
        {
          model: undefined,
          action: ["$query", "Raw"].join(""),
          args: { query: "select 1" },
        },
        async () => [],
      ),
    ).rejects.toThrow(/raw-sql action/i);
  });

  it("keeps system event model available without companyId (jobs/events path)", async () => {
    const { middleware } = await bootstrap("enforce");
    const next = jest.fn().mockResolvedValue({ id: "o1" });

    const result = await middleware!(
      {
        model: "OutboxMessage",
        action: "create",
        args: { data: { type: "test.event", payload: {} } },
      },
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: "o1" });
  });

  it("downgrades enforce to shadow for non-cohort tenant", async () => {
    process.env.TENANT_ENFORCE_COHORT = "canary-1";
    const { middleware } = await bootstrap("enforce");
    const next = jest.fn().mockResolvedValue([{ id: "t1" }]);

    const result = await middleware!(
      {
        model: "Task",
        action: "findMany",
        args: { where: { companyId: "regular-tenant", status: "PENDING" } },
      },
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: "t1" }]);
  });
});



