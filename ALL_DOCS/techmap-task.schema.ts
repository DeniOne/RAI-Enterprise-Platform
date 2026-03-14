// TechMapTask schema (MVP) — строго для plan/fact
export type TechMapTaskType =
    | "SOWING"
    | "FERTILIZATION"
    | "SPRAYING"
    | "CULTIVATION"
    | "HARVEST"
    | "MONITORING";

export type UnitRate = "kg_ha" | "l_ha" | "pcs_ha" | "t_ha";

export interface TechMapTaskPlanned {
    plannedStart: string; // ISO
    plannedEnd: string;   // ISO
    plannedAreaHa: number;

    plannedRate?: number;     // дозировка (если применимо)
    plannedRateUnit?: UnitRate;

    plannedCost?: number;     // в валюте сезона
    plannedCurrency?: "RUB" | "BYN" | "KZT" | "USD" | "EUR";

    inputs?: Array<{ name: string; qty?: number; unit?: string }>; // СЗР/семена/удобрения
}

export interface TechMapTaskMVP {
    id: string;
    type: TechMapTaskType;

    fieldRef: string;
    seasonRef: string;

    planned: TechMapTaskPlanned;

    // Связь задачи с тем, что контролёр будет считать
    metricLinks: Array<
        | "nitrogenApplied_vs_planned"
        | "operationDelayDays"
        | "costAccumulated_vs_budget"
        | "phenology_vs_calendar"
        | "ndviTrend_vs_expected"
    >;

    status: "PLANNED" | "ACTIVE" | "DONE" | "CANCELLED";
}

// TM-4: Adaptive Rules
export type AdaptiveTriggerType =
    | "WEATHER"
    | "NDVI"
    | "GDD"
    | "BBCH"
    | "PRICE"
    | "OBSERVATION";

export interface AdaptiveRuleCondition {
    parameter: string;
    operator: "GT" | "GTE" | "LT" | "LTE" | "EQ" | "NOT_EQ";
    threshold: number;
    unit?: string;
}

export interface AdaptiveRule {
    id: string;
    techMapId: string;
    companyId: string;
    name: string;
    triggerType: AdaptiveTriggerType;
    condition: AdaptiveRuleCondition;
    affectedOperationIds: string[];
    changeTemplate: Record<string, unknown>;
    isActive: boolean;
    lastEvaluatedAt?: string | null; // ISO
}

// TM-4: Hybrid Phenology Model
export interface HybridPhenologyModel {
    id: string;
    hybridName: string;
    cropType: string;
    companyId?: string | null;
    gddToStage: Record<string, number>;
    baseTemp?: number;
}

// TM-5: Budget Line
export type BudgetCategory =
    | "SEEDS"
    | "FERTILIZER"
    | "FERTILIZERS"
    | "PESTICIDES"
    | "FUEL"
    | "RENT"
    | "ANALYSES"
    | "MACHINERY"
    | "LABOR"
    | "LOGISTICS"
    | "OTHER";

export interface BudgetLine {
    id: string;
    techMapId: string;
    companyId: string;
    category: BudgetCategory;
    description?: string | null;
    plannedCost: number;
    actualCost?: number | null;
    tolerancePct?: number;
    unit?: string | null;
    plannedQty?: number | null;
    actualQty?: number | null;
    unitPrice?: number | null;
    operationId?: string | null;
}

// TM-5: Contract Core Payload
export interface ContractCorePayload {
    techMapId: string;
    companyId: string;
    fieldId: string;
    cropType: string;
    targetYieldTHa: number;
    budgetCapRubHa: number;
    criticalOperations: Array<{
        id: string;
        operationType: string;
        bbchWindowFrom: number | null;
    }>;
    sealedAt: string; // ISO
    version: number;
}
