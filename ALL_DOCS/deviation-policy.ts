export type Severity = "S0" | "S1" | "S2" | "S3" | "S4";

export interface DeviationRule {
    metric:
    | "nitrogenApplied_vs_planned"
    | "operationDelayDays"
    | "ndviTrend_vs_expected"
    | "costAccumulated_vs_budget"
    | "phenology_vs_calendar";

    // единый формат: absPctDeviation или absDaysDeviation
    type: "PCT" | "DAYS" | "ABS";

    // пороги
    s1: number;
    s2: number;
    s3: number;
    s4: number;

    // что делать при S3/S4
    escalateAt: Severity; // usually S3
}

export const MVP_DEVIATION_RULES: DeviationRule[] = [
    {
        metric: "nitrogenApplied_vs_planned",
        type: "PCT",
        s1: 5,
        s2: 10,
        s3: 20,
        s4: 30,
        escalateAt: "S3",
    },
    {
        metric: "operationDelayDays",
        type: "DAYS",
        s1: 1,
        s2: 3,
        s3: 5,
        s4: 7,
        escalateAt: "S3",
    },
    {
        metric: "costAccumulated_vs_budget",
        type: "PCT",
        s1: 5,
        s2: 10,
        s3: 20,
        s4: 30,
        escalateAt: "S3",
    },
    {
        metric: "phenology_vs_calendar",
        type: "DAYS",
        s1: 3,
        s2: 7,
        s3: 10,
        s4: 14,
        escalateAt: "S3",
    },
    {
        metric: "ndviTrend_vs_expected",
        type: "PCT",
        s1: 5,
        s2: 10,
        s3: 15,
        s4: 20,
        escalateAt: "S3",
    },
];