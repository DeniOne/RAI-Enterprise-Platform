import { BadRequestException } from "@nestjs/common";
import type {
  StrategyForecastDomain,
  StrategyForecastRunRequest,
  StrategyForecastScenarioDto,
  StrategyForecastScenarioSaveRequest,
  StrategyForecastScopeLevel,
  StrategyScenarioLever,
} from "../../modules/finance-economy/ofs/application/decision-intelligence.service";

const STRATEGY_SCENARIO_LEVERS: StrategyScenarioLever[] = [
  "yield_pct",
  "sales_price_pct",
  "input_cost_pct",
  "opex_pct",
  "working_capital_days",
  "disease_risk_pct",
];

function normalizeDriverStrength(value: number): number {
  return Math.max(0.05, Math.min(1, Math.abs(value)));
}

export function validateStrategyForecastRunRequest(
  request: StrategyForecastRunRequest,
): void {
  if (!request.seasonId?.trim()) {
    throw new BadRequestException("seasonId is required");
  }
  if (!["company", "farm", "field"].includes(request.scopeLevel)) {
    throw new BadRequestException("scopeLevel is invalid");
  }
  if (![30, 90, 180, 365].includes(request.horizonDays)) {
    throw new BadRequestException("horizonDays is invalid");
  }
  if (request.scopeLevel === "field" && !request.fieldId?.trim()) {
    throw new BadRequestException("fieldId is required for field scope");
  }
  if (!Array.isArray(request.domains) || request.domains.length === 0) {
    throw new BadRequestException("domains must contain at least one domain");
  }
}

export function validateStrategyForecastScenarioSaveRequest(
  request: StrategyForecastScenarioSaveRequest,
): void {
  if (!request.name?.trim()) {
    throw new BadRequestException("scenario name is required");
  }
  validateStrategyForecastRunRequest({
    scopeLevel: request.scopeLevel,
    seasonId: request.seasonId,
    horizonDays: request.horizonDays,
    farmId: request.farmId,
    fieldId: request.fieldId,
    crop: request.crop,
    domains: request.domains,
  });
}

export function buildStrategyForecastDrivers(input: {
  budgetRemaining: number;
  burnRate: number;
  currentBalance: number;
  diseaseRiskScore: number;
  expectedYield?: number;
  savingPotential: number;
}): Array<{ name: string; direction: "up" | "down"; strength: number }> {
  const drivers = [
    {
      name: "Остаток бюджета",
      direction: input.budgetRemaining > 0 ? ("up" as const) : ("down" as const),
      strength: normalizeDriverStrength(input.budgetRemaining / 500000),
    },
    {
      name: "Burn rate бюджета",
      direction: input.burnRate > 0.7 ? ("down" as const) : ("up" as const),
      strength: normalizeDriverStrength(input.burnRate),
    },
    {
      name: "Ликвидность",
      direction: input.currentBalance >= 0 ? ("up" as const) : ("down" as const),
      strength: normalizeDriverStrength(Math.abs(input.currentBalance) / 1000000),
    },
    {
      name: "Риск болезней",
      direction: input.diseaseRiskScore > 0.45 ? ("down" as const) : ("up" as const),
      strength: normalizeDriverStrength(input.diseaseRiskScore),
    },
  ];
  if (typeof input.expectedYield === "number") {
    drivers.push({
      name: "Прогноз урожайности",
      direction: input.expectedYield >= 35 ? "up" : "down",
      strength: normalizeDriverStrength(input.expectedYield / 60),
    });
  }
  if (input.savingPotential > 0) {
    drivers.push({
      name: "Потенциал экономии",
      direction: "up",
      strength: normalizeDriverStrength(input.savingPotential / 250000),
    });
  }
  return drivers.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

export function roundForecastMetric(value: number): number {
  return Math.round(value * 10) / 10;
}

export function toDecisionReason(error: unknown): string {
  const message = String((error as Error)?.message ?? error ?? "unknown");
  return message.slice(0, 96);
}

export function normalizeScenarioLeverValues(
  value: StrategyForecastScenarioSaveRequest["leverValues"],
): Record<StrategyScenarioLever, string> {
  return STRATEGY_SCENARIO_LEVERS.reduce(
    (acc, lever) => {
      const nextValue = value?.[lever];
      acc[lever] = typeof nextValue === "string" ? nextValue : "";
      return acc;
    },
    {} as Record<StrategyScenarioLever, string>,
  );
}

export function mapStrategyForecastScenarioRow(row: {
  id: string;
  name: string;
  scopeLevel: string;
  seasonId: string;
  horizonDays: number;
  farmId: string | null;
  fieldId: string | null;
  crop: string | null;
  domainsJson: unknown;
  leverValuesJson: unknown;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): StrategyForecastScenarioDto {
  const domains = Array.isArray(row.domainsJson)
    ? row.domainsJson.filter(
        (item): item is StrategyForecastDomain =>
          item === "agro" ||
          item === "economics" ||
          item === "finance" ||
          item === "risk",
      )
    : [];
  const leverValues = normalizeScenarioLeverValues(
    (row.leverValuesJson ?? {}) as StrategyForecastScenarioSaveRequest["leverValues"],
  );

  return {
    id: row.id,
    name: row.name,
    scopeLevel: row.scopeLevel as StrategyForecastScopeLevel,
    seasonId: row.seasonId,
    horizonDays: row.horizonDays as 30 | 90 | 180 | 365,
    farmId: row.farmId ?? "",
    fieldId: row.fieldId ?? "",
    crop: row.crop ?? "",
    domains,
    leverValues,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
