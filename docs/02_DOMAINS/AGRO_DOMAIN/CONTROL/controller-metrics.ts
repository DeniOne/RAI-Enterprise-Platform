export type ControllerMetricKey =
    | "nitrogenApplied_vs_planned"
    | "operationDelayDays"
    | "ndviTrend_vs_expected"
    | "costAccumulated_vs_budget"
    | "phenology_vs_calendar";

export interface MetricValue {
    key: ControllerMetricKey;
    value: number;
    unit: string;
    computedAt: string; // ISO
    scope: { fieldRef?: string; taskRef?: string; seasonRef?: string; farmRef?: string };
    evidenceRefs?: string[]; // events that contributed
}

export interface PlanFactInputs {
    planned: {
        nitrogenKgHa?: number;     // planned for period/task
        budget?: number;          // planned cost
        start?: string;           // planned start
        end?: string;             // planned end
        ndviExpected?: number;    // optional baseline
        phenologyExpectedBbch?: number;
    };
    fact: {
        nitrogenKgHa?: number;
        cost?: number;
        startedAt?: string;
        completedAt?: string;
        ndvi?: number;
        phenologyBbch?: number;
    };
}