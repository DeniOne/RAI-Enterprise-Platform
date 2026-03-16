import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { pathToFileURL } from "url";
import { PrismaClient } from "@rai/prisma-client";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_COMPANY_ID = "default-rai-company";
const ENFORCE_MODELS = [
  "FrontOfficeThread",
  "FrontOfficeThreadMessage",
  "FrontOfficeHandoffRecord",
  "FrontOfficeThreadParticipantState",
];

function readArg(name: string): string | null {
  const prefix = `${name}=`;
  const entry = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

async function resolveTenantId(prisma: PrismaClient, companyId: string) {
  const binding = await prisma.tenantCompanyBinding.findFirst({
    where: {
      companyId,
      isActive: true,
    },
    orderBy: [{ isPrimary: "desc" }, { boundAt: "asc" }],
    select: {
      tenantId: true,
    },
  });

  if (binding?.tenantId) {
    return binding.tenantId;
  }

  const tenantState = await prisma.tenantState.findUnique({
    where: {
      companyId,
    },
    select: {
      tenantId: true,
    },
  });

  if (!tenantState?.tenantId) {
    throw new Error(`No tenant mapping found for companyId=${companyId}`);
  }

  return tenantState.tenantId;
}

async function captureSnapshot(params: {
  companyId: string;
  tenantId: string;
  enforceModels: string[];
}) {
  const { PrismaService } = await import(
    pathToFileURL(
      path.resolve(
        process.cwd(),
        "apps/api/src/shared/prisma/prisma.service.ts",
      ),
    ).href
  );
  const { TenantContextService } = await import(
    pathToFileURL(
      path.resolve(
        process.cwd(),
        "apps/api/src/shared/tenant-context/tenant-context.service.ts",
      ),
    ).href
  );
  const { TenantScope } = await import(
    pathToFileURL(
      path.resolve(
        process.cwd(),
        "apps/api/src/shared/tenant-context/tenant-scope.ts",
      ),
    ).href
  );

  process.env.TENANT_DUAL_KEY_MODE = "shadow";
  process.env.TENANT_DUAL_KEY_COMPANY_FALLBACK = "true";
  process.env.TENANT_DUAL_KEY_ENFORCE_MODELS = params.enforceModels.join(",");

  const tenantContext = new TenantContextService();
  const prismaService = new PrismaService(tenantContext);
  await prismaService.onModuleInit();

  try {
    const scope = new TenantScope(params.companyId, false, params.tenantId);
    return await tenantContext.run({ scope }, async () => {
      const threads = await prismaService.frontOfficeThread.findMany({
        where: {
          companyId: params.companyId,
        },
        orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      });

      const threadIds = threads.map((thread: { id: string }) => thread.id);

      const [messages, handoffs, participantStates] = await Promise.all([
        prismaService.frontOfficeThreadMessage.findMany({
          where: {
            companyId: params.companyId,
            threadId: { in: threadIds },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        prismaService.frontOfficeHandoffRecord.findMany({
          where: {
            companyId: params.companyId,
            threadId: { in: threadIds },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        }),
        prismaService.frontOfficeThreadParticipantState.findMany({
          where: {
            companyId: params.companyId,
            threadId: { in: threadIds },
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        }),
      ]);

      return {
        threads: threads.map((row: any) => row.id).sort(),
        messages: messages.map((row: any) => row.id).sort(),
        handoffs: handoffs.map((row: any) => row.id).sort(),
        participantStates: participantStates.map((row: any) => row.id).sort(),
      };
    });
  } finally {
    await prismaService.onModuleDestroy();
  }
}

function equalSnapshots(
  baseline: Record<string, string[]>,
  candidate: Record<string, string[]>,
) {
  return Object.keys(baseline).every((key) => {
    const left = JSON.stringify(baseline[key] || []);
    const right = JSON.stringify(candidate[key] || []);
    return left === right;
  });
}

async function run() {
  const companyId = readArg("--company-id") || DEFAULT_COMPANY_ID;
  const prisma = new PrismaClient();

  try {
    const tenantId = await resolveTenantId(prisma, companyId);
    const generatedAt = new Date().toISOString();

    const baseline = await captureSnapshot({
      companyId,
      tenantId,
      enforceModels: [],
    });

    const cutover = await captureSnapshot({
      companyId,
      tenantId,
      enforceModels: ENFORCE_MODELS,
    });

    const rollback = await captureSnapshot({
      companyId,
      tenantId,
      enforceModels: [],
    });

    const cutoverPass = equalSnapshots(baseline, cutover);
    const rollbackPass = equalSnapshots(baseline, rollback);

    const report = [
      "# DB_FRONT_OFFICE_CUTOVER_DRILL",
      "",
      `- Generated at: \`${generatedAt}\``,
      "- Drill type: `runtime cutover + rollback smoke`.",
      `- companyId: \`${companyId}\``,
      `- tenantId: \`${tenantId}\``,
      "",
      "## Flag package",
      "",
      "- `TENANT_DUAL_KEY_MODE=shadow`",
      `- \`TENANT_DUAL_KEY_ENFORCE_MODELS=${ENFORCE_MODELS.join(",")}\``,
      "- `TENANT_DUAL_KEY_COMPANY_FALLBACK=true`",
      "",
      "## Snapshot comparison",
      "",
      "| Slice | Baseline | Cutover | Rollback |",
      "| --- | ---: | ---: | ---: |",
      `| \`threads\` | ${baseline.threads.length} | ${cutover.threads.length} | ${rollback.threads.length} |`,
      `| \`messages\` | ${baseline.messages.length} | ${cutover.messages.length} | ${rollback.messages.length} |`,
      `| \`handoffs\` | ${baseline.handoffs.length} | ${cutover.handoffs.length} | ${rollback.handoffs.length} |`,
      `| \`participant_states\` | ${baseline.participantStates.length} | ${cutover.participantStates.length} | ${rollback.participantStates.length} |`,
      "",
      "## Verification",
      "",
      `- cutover snapshot parity: \`${cutoverPass ? "PASS" : "FAIL"}\``,
      `- rollback snapshot parity: \`${rollbackPass ? "PASS" : "FAIL"}\``,
      "",
      "## Rollback trigger",
      "",
      "- любой `TENANT_DRIFT` alert по front-office family;",
      "- любой row-count mismatch в `DB_FRONT_OFFICE_SHADOW_COMPARE.md`;",
      "- любой `404`/empty result на known-good thread после включения feature flag;",
      "- p95 latency по front-office reads > `+20%` против baseline окна.",
      "",
      "## Rollback action",
      "",
      "- удалить `TENANT_DUAL_KEY_ENFORCE_MODELS` из runtime env;",
      "- перезапустить API;",
      "- повторно прогнать `pnpm db:front-office-wave:shadow-compare`;",
      "",
      "## Verdict",
      "",
      `- rollback verification status: \`${cutoverPass && rollbackPass ? "VERIFIED" : "FAILED"}\``,
    ].join("\n");

    const out = path.resolve(
      process.cwd(),
      "docs/01_ARCHITECTURE/DATABASE/DB_FRONT_OFFICE_CUTOVER_DRILL.md",
    );
    fs.writeFileSync(out, `${report}\n`);
    console.log(out);

    if (!cutoverPass || !rollbackPass) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
