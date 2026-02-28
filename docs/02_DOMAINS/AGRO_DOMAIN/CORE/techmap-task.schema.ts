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