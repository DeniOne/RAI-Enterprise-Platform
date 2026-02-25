import { createHash } from "crypto";
import { EconomicEventType } from "@rai/prisma-client";
import { IngestEconomicEventDto } from "../economy/application/economy.service";

export const FINANCE_INGEST_CONTRACT_VERSION = "1.0.0";
export const FINANCE_INGEST_SUPPORTED_VERSIONS = [
  FINANCE_INGEST_CONTRACT_VERSION,
] as const;

type IntegrationSource =
  | "TASK_MODULE"
  | "HR_MODULE"
  | "CONSULTING_ORCHESTRATOR";

interface BaseContractInput {
  source: IntegrationSource;
  sourceEventId: string;
  traceId: string;
  companyId: string;
  type: EconomicEventType;
  amount: number;
  currency?: string;
  fieldId?: string;
  seasonId?: string;
  employeeId?: string;
  metadata?: Record<string, unknown>;
}

export function buildFinanceIngestEvent(
  input: BaseContractInput,
): IngestEconomicEventDto {
  const idempotencyKey = createIdempotencyKey(
    input.source,
    input.sourceEventId,
    input.companyId,
    input.type,
    input.amount,
  );

  return {
    type: input.type,
    amount: input.amount,
    currency: input.currency || "RUB",
    companyId: input.companyId,
    fieldId: input.fieldId,
    seasonId: input.seasonId,
    employeeId: input.employeeId,
    metadata: {
      ...input.metadata,
      source: input.source,
      traceId: input.traceId,
      sourceEventId: input.sourceEventId,
      idempotencyKey,
      contractVersion: FINANCE_INGEST_CONTRACT_VERSION,
    },
  };
}

function createIdempotencyKey(
  source: IntegrationSource,
  sourceEventId: string,
  companyId: string,
  type: EconomicEventType,
  amount: number,
): string {
  const canonical = `${FINANCE_INGEST_CONTRACT_VERSION}|${source}|${sourceEventId}|${companyId}|${type}|${amount}`;
  return createHash("sha256").update(canonical).digest("hex");
}
