import { createHash } from "crypto";
import { EconomicEventType, Prisma } from "@rai/prisma-client";
import { resolveJournalPhase, resolveSettlementRef } from "../../modules/finance-economy/economy/domain/journal-policy";

export interface IngestEconomicEventDto {
  type: EconomicEventType;
  amount: number | Prisma.Decimal;
  currency?: string;
  metadata?: any;
  fieldId?: string;
  seasonId?: string;
  employeeId?: string;
  companyId: string;
}

export function extractIdempotencyKey(metadata: any): string | null {
  const key = metadata?.idempotencyKey;
  if (typeof key === "string" && key.trim().length > 0) {
    return key.trim();
  }
  return null;
}

export function extractReplayKey(
  dto: IngestEconomicEventDto,
  normalizedAmount: Prisma.Decimal,
  idempotencyKey: string | null,
): string | null {
  const explicitReplayKey = dto.metadata?.replayKey;
  if (typeof explicitReplayKey === "string" && explicitReplayKey.trim().length > 0) {
    return explicitReplayKey.trim();
  }

  const sourceEventId =
    dto.metadata?.sourceEventId ||
    dto.metadata?.externalEventId ||
    dto.metadata?.eventId;
  if (typeof sourceEventId === "string" && sourceEventId.trim().length > 0) {
    return `src:${sourceEventId.trim()}`;
  }

  if (idempotencyKey) {
    return `idem:${idempotencyKey}`;
  }

  const traceId = dto.metadata?.traceId;
  const source = dto.metadata?.source;
  if (
    typeof traceId === "string" &&
    traceId.trim().length > 0 &&
    typeof source === "string" &&
    source.trim().length > 0
  ) {
    const fingerprint = {
      companyId: dto.companyId,
      type: dto.type,
      amount: normalizedAmount.toString(),
      currency: dto.currency || "RUB",
      source: source.trim(),
      traceId: traceId.trim(),
      fieldId: dto.fieldId || null,
      seasonId: dto.seasonId || null,
      employeeId: dto.employeeId || null,
      metadata: sortObjectKeys(dto.metadata || {}),
    };
    const digest = createHash("sha256")
      .update(JSON.stringify(fingerprint))
      .digest("hex");
    return `fp:${digest}`;
  }

  return null;
}

export function isUniqueConflict(error: unknown, targetField?: string): boolean {
  const isP2002 =
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  if (!isP2002 || !targetField) {
    return isP2002;
  }

  const target = (error.meta as any)?.target;
  if (Array.isArray(target)) {
    return target.includes(targetField);
  }
  return target === targetField;
}

export function isIntegrityViolation(error: any): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const sqlState = (error.meta as any)?.db_error_code || "";
    if (["P0001", "P0002", "P0003", "P0004", "P2004"].includes(sqlState || error.code)) {
      return true;
    }
  }

  const msg = error?.message || "";
  return (
    msg.includes("IMBALANCED_ENTRY") ||
    msg.includes("INCOMPLETE_ENTRY") ||
    msg.includes("P0004") ||
    msg.includes("READ_ONLY") ||
    msg.includes("check constraint") ||
    msg.includes("constraint")
  );
}

export function enrichFinancialMetadata(
  type: EconomicEventType,
  metadata: any,
): Record<string, unknown> {
  const input = metadata && typeof metadata === "object" ? metadata : {};
  const base = input as Record<string, unknown>;
  return {
    ...base,
    journalPhase: resolveJournalPhase(type),
    settlementRef: resolveSettlementRef(type, base),
  };
}

function sortObjectKeys(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key]);
      return acc;
    }, {} as any);
}
