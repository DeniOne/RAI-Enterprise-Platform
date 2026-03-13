import type { Prisma } from "@rai/prisma-client";
import {
  CreateCommerceContractResult,
  GetCommerceContractResult,
} from "./rai-tools.types";

export function mapCreatedContract(
  created: {
    id: string;
    number: string;
    type: string;
    status: string;
    validFrom: Date;
    validTo: Date | null;
    jurisdictionId: string;
    regulatoryProfileId: string | null;
    roles: Array<{
      id: string;
      partyId: string;
      role: string;
      isPrimary: boolean;
    }>;
  },
): CreateCommerceContractResult {
  return {
    id: created.id,
    number: created.number,
    type: created.type,
    status: created.status,
    validFrom: created.validFrom.toISOString(),
    validTo: created.validTo?.toISOString() ?? null,
    jurisdictionId: created.jurisdictionId,
    regulatoryProfileId: created.regulatoryProfileId,
    roles: created.roles.map((role) => ({
      id: role.id,
      partyId: role.partyId,
      role: role.role,
      isPrimary: role.isPrimary,
    })),
  };
}

export function mapContractSummary(contract: {
  id: string;
  number: string;
  type: string;
  status: string;
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  roles: Array<{
    id: string;
    role: string;
    isPrimary: boolean;
    party: {
      id: string;
      legalName: string;
    };
  }>;
}): GetCommerceContractResult {
  return {
    id: contract.id,
    number: contract.number,
    type: contract.type,
    status: contract.status,
    validFrom: contract.validFrom.toISOString(),
    validTo: contract.validTo?.toISOString() ?? null,
    createdAt: contract.createdAt.toISOString(),
    roles: contract.roles.map((role) => ({
      id: role.id,
      role: role.role,
      isPrimary: role.isPrimary,
      party: role.party,
    })),
  };
}

export function normalizeJsonObject(
  value: Prisma.JsonValue,
): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}
