import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceTopologyService } from "./trace-topology.service";

describe("TraceTopologyService", () => {
  let service: TraceTopologyService;
  let prisma: PrismaService;

  const companyId = "company-a";
  const otherCompanyId = "company-b";
  const traceId = "trace-1";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TraceTopologyService,
        {
          provide: PrismaService,
          useValue: {
            aiAuditEntry: { findMany: jest.fn() },
            traceSummary: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(TraceTopologyService);
    prisma = module.get(PrismaService);
  });

  it("returns topology and critical path for own trace", async () => {
    const createdAt = new Date("2026-03-05T12:00:00Z");
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: "entry-1",
        traceId,
        companyId,
        toolNames: ["echo_message"],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        metadata: null,
        createdAt,
      },
    ]);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue({
      traceId,
      companyId,
      durationMs: 150,
    });

    const result = await service.getTraceTopology(traceId, companyId);

    expect(result.traceId).toBe(traceId);
    expect(result.companyId).toBe(companyId);
    expect(result.nodes.length).toBeGreaterThanOrEqual(2);
    expect(result.nodes.find((n) => n.id === "__root__")).toBeDefined();
    expect(result.criticalPathNodeIds).toContain("__root__");
    expect(result.totalDurationMs).toBe(150);
  });

  it("throws NotFound when trace has no audit entries", async () => {
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getTraceTopology(traceId, companyId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws Forbidden when trace belongs to another tenant", async () => {
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: "entry-1",
        traceId,
        companyId: otherCompanyId,
        toolNames: [],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        metadata: null,
        createdAt: new Date(),
      },
    ]);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getTraceTopology(traceId, companyId)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("selects slowest branch in critical path (parallel execution)", async () => {
    const base = new Date("2026-03-05T12:00:00Z");
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([
      { id: "fast", traceId, companyId, toolNames: [], model: "x", intentMethod: null, tokensUsed: 0, metadata: { phases: [{ durationMs: 50 }] }, createdAt: base },
      { id: "slow", traceId, companyId, toolNames: ["tool_a"], model: "x", intentMethod: null, tokensUsed: 0, metadata: { phases: [{ durationMs: 200 }] }, createdAt: new Date(base.getTime() + 10) },
    ]);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue({
      traceId,
      companyId,
      durationMs: 210,
    });

    const result = await service.getTraceTopology(traceId, companyId);

    expect(result.criticalPathNodeIds).toContain("__root__");
    // ID теперь взрывается как entryId:phaseName или entryId:index
    expect(result.criticalPathNodeIds.some(id => id.startsWith("slow:"))).toBe(true);
    const slowNode = result.nodes.find((n) => n.id.startsWith("slow:"));
    expect(slowNode?.durationMs).toBe(200);
  });

  it("explodes multiple phases into separate topology nodes", async () => {
    const createdAt = new Date();
    (prisma.aiAuditEntry.findMany as jest.Mock).mockResolvedValue([
      {
        id: "e1",
        traceId,
        companyId,
        toolNames: ["t1"],
        metadata: {
          phases: [
            { name: "router", durationMs: 10, timestamp: createdAt.toISOString() },
            { name: "tools", durationMs: 50, timestamp: createdAt.toISOString() },
          ],
        },
        createdAt,
      },
    ]);
    (prisma.traceSummary.findFirst as jest.Mock).mockResolvedValue({ durationMs: 60 });

    const result = await service.getTraceTopology(traceId, companyId);

    expect(result.nodes).toHaveLength(3); // root + 2 phases
    expect(result.nodes.find(n => n.id === "e1:router")).toBeDefined();
    expect(result.nodes.find(n => n.id === "e1:tools")).toBeDefined();
    expect(result.nodes.find(n => n.id === "e1:tools")?.label).toContain("tools: t1");
  });
});
