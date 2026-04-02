import type {
  CanonicalBranchId,
  ControlPointDraft,
  GenerationStageDraft,
  MonitoringSignalDraft,
  RuleBindingDraft,
  ThresholdBindingDraft,
} from "./tech-map-generation.types";

export const RAPESEED_SCHEMA_VERSION = "1.0.0";
export const RAPESEED_RULE_REGISTRY_VERSION = "1.0.0";
export const RAPESEED_ONTOLOGY_VERSION = "1.0.0";
export const RAPESEED_GENERATOR_VERSION = "1.1.0";

const winterStages: GenerationStageDraft[] = [
  {
    code: "field_preparation",
    name: "Подготовка поля",
    sequence: 1,
    aplStageId: "01_PRE_SOWING_ANALYSIS",
    stageGoal: "Подтвердить допуск поля и подготовить основание под посев озимого рапса.",
    bbchScope: ["00", "09"],
    operations: [
      {
        code: "field_admission_check",
        name: "Допуск поля под озимый рапс",
        description: "Проверка pH, севооборота, предшественника и полноты почвенных данных.",
        operationType: "INSPECTION",
        startOffsetDays: 0,
        durationHours: 4,
        isCritical: true,
        resources: [{ type: "SERVICE", name: "Полевой аудит", amount: 1, unit: "unit", costPerUnit: 2500 }],
      },
    ],
  },
  {
    code: "sowing",
    name: "Посев",
    sequence: 2,
    aplStageId: "04_SOWING",
    stageGoal: "Выполнить посев с обязательным протравливанием и прикатыванием.",
    bbchScope: ["10", "12"],
    operations: [
      {
        code: "seed_treatment",
        name: "Протравливание семян",
        description: "Обязательное инсекто-фунгицидное протравливание семян.",
        operationType: "SEED_TREATMENT",
        startOffsetDays: 4,
        durationHours: 4,
        resources: [{ type: "PESTICIDE", name: "Протравитель семян", amount: 1, unit: "l", costPerUnit: 1200 }],
      },
      {
        code: "winter_rapeseed_sowing",
        name: "Посев озимого рапса",
        description: "Посев рапса по канонической ветке озимого профиля.",
        operationType: "SEEDING",
        startOffsetDays: 7,
        durationHours: 8,
        isCritical: true,
        bbchWindowFrom: "10",
        bbchWindowTo: "12",
        resources: [
          { type: "SEED", name: "Семена рапса", amount: 5.2, unit: "kg", costPerUnit: 760 },
          { type: "FERTILIZER", name: "Стартовый комплекс NPK", amount: 90, unit: "kg", costPerUnit: 29 },
        ],
      },
      {
        code: "post_sowing_rolling",
        name: "Прикатывание после посева",
        description: "Выравнивание посевного ложа и обеспечение контакта семян с почвой.",
        operationType: "ROLLING",
        startOffsetDays: 8,
        durationHours: 4,
        resources: [{ type: "SERVICE", name: "Прикатывание", amount: 1, unit: "unit", costPerUnit: 1100 }],
      },
    ],
  },
  {
    code: "autumn_care",
    name: "Осенний уход",
    sequence: 3,
    aplStageId: "05_PROTECTION_EARLY",
    stageGoal: "Стабилизировать розетку и подготовить культуру к зиме.",
    bbchScope: ["14", "19"],
    operations: [
      {
        code: "autumn_growth_regulator",
        name: "Осенний регулятор роста",
        description: "Триазольная обработка в фазу 4-6 листьев.",
        operationType: "FUNGICIDE_APP",
        startOffsetDays: 28,
        durationHours: 4,
        isCritical: true,
        bbchWindowFrom: "14",
        bbchWindowTo: "16",
        resources: [{ type: "PESTICIDE", name: "Регулятор роста", amount: 0.7, unit: "l", costPerUnit: 1800 }],
      },
      {
        code: "autumn_rosette_assessment",
        name: "Оценка розетки перед зимовкой",
        description: "Оценка числа листьев, шейки и точки роста.",
        operationType: "INSPECTION",
        startOffsetDays: 42,
        durationHours: 3,
        resources: [{ type: "SERVICE", name: "Агрономическая оценка", amount: 1, unit: "unit", costPerUnit: 900 }],
      },
    ],
  },
  {
    code: "winter_dormancy",
    name: "Перезимовка",
    sequence: 4,
    aplStageId: "08_WINTERING",
    stageGoal: "Контролировать риски перезимовки и сохранить культуру.",
    bbchScope: ["19", "21"],
    operations: [
      {
        code: "overwintering_assessment",
        name: "Контроль перезимовки",
        description: "Оценка состояния культуры после выхода из зимы.",
        operationType: "INSPECTION",
        startOffsetDays: 165,
        durationHours: 4,
        isCritical: true,
        resources: [{ type: "SERVICE", name: "Весенний аудит", amount: 1, unit: "unit", costPerUnit: 1300 }],
      },
    ],
  },
  {
    code: "spring_renewal",
    name: "Весеннее возобновление",
    sequence: 5,
    aplStageId: "09_SPRING_RESTART",
    stageGoal: "Поддержать быстрый старт вегетации азотом и серой.",
    bbchScope: ["21", "30"],
    operations: [
      {
        code: "spring_n_s_application",
        name: "Весеннее внесение азота и серы",
        description: "Обязательное питание при возобновлении вегетации.",
        operationType: "FERTILIZER_APP",
        startOffsetDays: 180,
        durationHours: 8,
        isCritical: true,
        resources: [
          { type: "FERTILIZER", name: "Аммиачная селитра", amount: 160, unit: "kg", costPerUnit: 24 },
          { type: "FERTILIZER", name: "Сера гранулированная", amount: 25, unit: "kg", costPerUnit: 19 },
        ],
      },
    ],
  },
  {
    code: "stem_elongation_budding",
    name: "Стеблевание и бутонизация",
    sequence: 6,
    aplStageId: "11_STEM_ELONGATION",
    stageGoal: "Поддержать растение до цветения и закрыть дефицит бора.",
    bbchScope: ["30", "52"],
    operations: [
      {
        code: "boron_foliar",
        name: "Внекорневая подкормка бором",
        description: "Обязательное внесение бора на BBCH 50-52.",
        operationType: "FERTILIZER_APP",
        startOffsetDays: 205,
        durationHours: 4,
        isCritical: true,
        bbchWindowFrom: "50",
        bbchWindowTo: "52",
        resources: [{ type: "FERTILIZER", name: "Бор листовой", amount: 1.1, unit: "l", costPerUnit: 620 }],
      },
    ],
  },
  {
    code: "flowering",
    name: "Цветение",
    sequence: 7,
    aplStageId: "12_FLOWERING",
    stageGoal: "Защитить урожай от болезней цветения и погодных стрессов.",
    bbchScope: ["60", "69"],
    operations: [
      {
        code: "flowering_fungicide",
        name: "Фунгицид в цветение",
        description: "Контроль склеротиниоза в фазу цветения.",
        operationType: "FUNGICIDE_APP",
        startOffsetDays: 220,
        durationHours: 5,
        isCritical: true,
        bbchWindowFrom: "60",
        bbchWindowTo: "65",
        resources: [{ type: "PESTICIDE", name: "Фунгицид цветения", amount: 0.9, unit: "l", costPerUnit: 2100 }],
      },
    ],
  },
  {
    code: "pod_filling_ripening",
    name: "Налив и созревание",
    sequence: 8,
    aplStageId: "14_POD_FILLING",
    stageGoal: "Подготовить уборку и контролировать риски осыпания.",
    bbchScope: ["70", "89"],
    operations: [
      {
        code: "preharvest_assessment",
        name: "Предуборочная оценка",
        description: "Проверка готовности к уборке и логистики.",
        operationType: "INSPECTION",
        startOffsetDays: 285,
        durationHours: 3,
        resources: [{ type: "SERVICE", name: "Предуборочный осмотр", amount: 1, unit: "unit", costPerUnit: 1800 }],
      },
    ],
  },
  {
    code: "harvest",
    name: "Уборка",
    sequence: 9,
    aplStageId: "15_HARVESTING",
    stageGoal: "Убрать культуру в оптимальное окно без потери семян.",
    bbchScope: ["89", "99"],
    operations: [
      {
        code: "harvest_with_rapeseed_header",
        name: "Уборка с рапсовым столом",
        description: "Финальная уборочная операция с рапсовой жаткой.",
        operationType: "HARVEST",
        startOffsetDays: 300,
        durationHours: 12,
        isCritical: true,
        resources: [
          { type: "FUEL", name: "Дизельное топливо", amount: 24, unit: "l", costPerUnit: 68 },
          { type: "SERVICE", name: "Логистика урожая", amount: 1, unit: "unit", costPerUnit: 6400 },
        ],
      },
    ],
  },
];

const springStages: GenerationStageDraft[] = [
  {
    code: "autumn_field_preparation",
    name: "Осенняя подготовка поля",
    sequence: 1,
    aplStageId: "01_PRE_SOWING_ANALYSIS",
    stageGoal: "Подготовить поле с запретом на весеннюю вспашку.",
    bbchScope: ["00", "09"],
    operations: [
      {
        code: "field_admission_check",
        name: "Допуск поля под яровой рапс",
        description: "Проверка pH, севооборота, предшественника и качества данных.",
        operationType: "INSPECTION",
        startOffsetDays: 0,
        durationHours: 4,
        isCritical: true,
        resources: [{ type: "SERVICE", name: "Полевой аудит", amount: 1, unit: "unit", costPerUnit: 2500 }],
      },
      {
        code: "autumn_primary_tillage",
        name: "Основная осенняя обработка",
        description: "Обязательная осенняя обработка вместо весенней вспашки.",
        operationType: "TILLAGE",
        startOffsetDays: 2,
        durationHours: 6,
        isCritical: true,
        resources: [{ type: "FUEL", name: "Дизельное топливо", amount: 18, unit: "l", costPerUnit: 68 }],
      },
    ],
  },
  {
    code: "spring_presowing",
    name: "Весенняя предпосевная подготовка",
    sequence: 2,
    aplStageId: "03_PRE_SOWING",
    stageGoal: "Сформировать семенное ложе без потери влаги.",
    bbchScope: ["00", "09"],
    operations: [
      {
        code: "spring_seedbed_prep",
        name: "Подготовка семенного ложа",
        description: "Лёгкая предпосевная подготовка без весенней вспашки.",
        operationType: "SOIL_PREP",
        startOffsetDays: 10,
        durationHours: 6,
        resources: [{ type: "FUEL", name: "Дизельное топливо", amount: 12, unit: "l", costPerUnit: 68 }],
      },
    ],
  },
  {
    code: "sowing",
    name: "Посев",
    sequence: 3,
    aplStageId: "04_SOWING",
    stageGoal: "Выполнить ранний посев при открытии окна температуры почвы.",
    bbchScope: ["10", "12"],
    operations: [
      {
        code: "seed_treatment",
        name: "Протравливание семян",
        description: "Обязательное протравливание семян для яровой ветки.",
        operationType: "SEED_TREATMENT",
        startOffsetDays: 12,
        durationHours: 3,
        resources: [{ type: "PESTICIDE", name: "Протравитель семян", amount: 1, unit: "l", costPerUnit: 1200 }],
      },
      {
        code: "spring_rapeseed_sowing",
        name: "Посев ярового рапса",
        description: "Посев по канонической ветке ярового рапса.",
        operationType: "SEEDING",
        startOffsetDays: 14,
        durationHours: 8,
        isCritical: true,
        bbchWindowFrom: "10",
        bbchWindowTo: "12",
        resources: [{ type: "SEED", name: "Семена рапса", amount: 6.0, unit: "kg", costPerUnit: 730 }],
      },
      {
        code: "post_sowing_rolling",
        name: "Прикатывание после посева",
        description: "Обязательное прикатывание после сева.",
        operationType: "ROLLING",
        startOffsetDays: 15,
        durationHours: 3,
        resources: [{ type: "SERVICE", name: "Прикатывание", amount: 1, unit: "unit", costPerUnit: 1100 }],
      },
    ],
  },
  {
    code: "early_growth",
    name: "Ранний рост",
    sequence: 4,
    aplStageId: "05_PROTECTION_EARLY",
    stageGoal: "Защитить молодые всходы и контролировать крестоцветную блошку.",
    bbchScope: ["12", "19"],
    operations: [
      {
        code: "flea_beetle_monitoring",
        name: "Мониторинг крестоцветной блошки",
        description: "Обязательный мониторинг ранних вредителей.",
        operationType: "INSPECTION",
        startOffsetDays: 25,
        durationHours: 2,
        isCritical: true,
        resources: [{ type: "SERVICE", name: "Скаутинг вредителей", amount: 1, unit: "unit", costPerUnit: 800 }],
      },
    ],
  },
  {
    code: "stem_elongation_budding",
    name: "Стеблевание и бутонизация",
    sequence: 5,
    aplStageId: "11_STEM_ELONGATION",
    stageGoal: "Поддержать развитие до цветения и закрыть дефицит бора.",
    bbchScope: ["30", "52"],
    operations: [
      {
        code: "boron_foliar",
        name: "Внекорневая подкормка бором",
        description: "Обязательное внесение бора на BBCH 50-52.",
        operationType: "FERTILIZER_APP",
        startOffsetDays: 55,
        durationHours: 4,
        isCritical: true,
        bbchWindowFrom: "50",
        bbchWindowTo: "52",
        resources: [{ type: "FERTILIZER", name: "Бор листовой", amount: 1.1, unit: "l", costPerUnit: 620 }],
      },
    ],
  },
  {
    code: "flowering",
    name: "Цветение",
    sequence: 6,
    aplStageId: "12_FLOWERING",
    stageGoal: "Контролировать стресс жары и заболевания в цветение.",
    bbchScope: ["60", "69"],
    operations: [
      {
        code: "flowering_fungicide",
        name: "Фунгицид цветения",
        description: "Контроль болезней в фазу цветения.",
        operationType: "FUNGICIDE_APP",
        startOffsetDays: 75,
        durationHours: 5,
        isCritical: true,
        resources: [{ type: "PESTICIDE", name: "Фунгицид", amount: 0.9, unit: "l", costPerUnit: 2100 }],
      },
    ],
  },
  {
    code: "pod_filling_ripening",
    name: "Налив и созревание",
    sequence: 7,
    aplStageId: "14_POD_FILLING",
    stageGoal: "Подготовить уборочное окно и контролировать осыпание.",
    bbchScope: ["70", "89"],
    operations: [
      {
        code: "preharvest_assessment",
        name: "Предуборочная оценка",
        description: "Проверка готовности к уборке.",
        operationType: "INSPECTION",
        startOffsetDays: 100,
        durationHours: 3,
        resources: [{ type: "SERVICE", name: "Предуборочный осмотр", amount: 1, unit: "unit", costPerUnit: 1800 }],
      },
    ],
  },
  {
    code: "harvest",
    name: "Уборка",
    sequence: 8,
    aplStageId: "15_HARVESTING",
    stageGoal: "Убрать урожай в оптимальное окно.",
    bbchScope: ["89", "99"],
    operations: [
      {
        code: "harvest_with_rapeseed_header",
        name: "Уборка с рапсовым столом",
        description: "Уборочная операция для яровой ветки.",
        operationType: "HARVEST",
        startOffsetDays: 115,
        durationHours: 12,
        isCritical: true,
        resources: [
          { type: "FUEL", name: "Дизельное топливо", amount: 22, unit: "l", costPerUnit: 68 },
          { type: "SERVICE", name: "Логистика урожая", amount: 1, unit: "unit", costPerUnit: 6200 },
        ],
      },
    ],
  },
];

const controlPoints: Record<CanonicalBranchId, ControlPointDraft[]> = {
  winter_rapeseed: [
    {
      stageCode: "autumn_care",
      name: "Контроль осенней розетки",
      bbchScope: ["14", "16"],
      requiredObservations: ["leaf_count", "neck_diameter_mm", "growth_point_height_cm"],
      acceptanceRanges: { leaf_count: [6, 8], neck_diameter_mm: { min: 8 }, growth_point_height_cm: { max: 2 } },
      severityOnFailure: "critical",
    },
    {
      stageCode: "winter_dormancy",
      name: "Контроль перезимовки",
      bbchScope: ["19", "21"],
      requiredObservations: ["overwintering_survival_pct", "plant_density"],
      acceptanceRanges: { overwintering_survival_pct: { min: 40 } },
      severityOnFailure: "blocker",
    },
  ],
  spring_rapeseed: [
    {
      stageCode: "early_growth",
      name: "Контроль раннего вредителя",
      bbchScope: ["12", "14"],
      requiredObservations: ["flea_beetle_pressure", "plant_density"],
      acceptanceRanges: { flea_beetle_pressure: { max: "economic_threshold" } },
      severityOnFailure: "critical",
    },
  ],
};

const monitoringSignals: Record<CanonicalBranchId, MonitoringSignalDraft[]> = {
  winter_rapeseed: [
    {
      signalType: "frost_alert",
      source: "meteo_api",
      thresholdLogic: "forecast_temp < -3 AND bbch IN [09,12]",
      severity: "critical",
      resultingAction: "alert_frost_risk",
    },
    {
      signalType: "heat_alert",
      source: "meteo_api",
      thresholdLogic: "forecast_temp > 30 AND bbch IN [60,69]",
      severity: "critical",
      resultingAction: "alert_yield_loss_expected",
    },
  ],
  spring_rapeseed: [
    {
      signalType: "heat_alert",
      source: "meteo_api",
      thresholdLogic: "forecast_temp > 30 AND bbch IN [60,69]",
      severity: "critical",
      resultingAction: "alert_yield_loss_expected",
    },
  ],
};

const ruleBindings: Record<CanonicalBranchId, RuleBindingDraft[]> = {
  winter_rapeseed: [
    { ruleId: "R-ADM-001", layer: "CANONICAL", type: "HARD_BLOCKER", appliesTo: "admission", ref: "field_admission_check", confidence: "HIGH" },
    { ruleId: "R-ADM-003", layer: "CANONICAL", type: "HARD_BLOCKER", appliesTo: "admission", ref: "field_admission_check", confidence: "HIGH" },
    { ruleId: "R-NUT-001", layer: "CANONICAL", type: "HARD_REQUIREMENT", appliesTo: "operation", ref: "spring_n_s_application", confidence: "HIGH" },
    { ruleId: "R-NUT-002", layer: "CANONICAL", type: "HARD_REQUIREMENT", appliesTo: "operation", ref: "boron_foliar", confidence: "HIGH" },
    { ruleId: "R-WIN-001", layer: "CANONICAL", type: "HARD_REQUIREMENT", appliesTo: "control_point", ref: "Контроль осенней розетки", confidence: "HIGH" },
    { ruleId: "R-WIN-006", layer: "DYNAMIC_SEASONAL", type: "HUMAN_REVIEW_REQUIRED", appliesTo: "control_point", ref: "Контроль перезимовки", confidence: "MEDIUM" },
  ],
  spring_rapeseed: [
    { ruleId: "R-ADM-001", layer: "CANONICAL", type: "HARD_BLOCKER", appliesTo: "admission", ref: "field_admission_check", confidence: "HIGH" },
    { ruleId: "R-SOIL-003", layer: "CANONICAL", type: "HARD_BLOCKER", appliesTo: "stage", ref: "autumn_field_preparation", confidence: "HIGH" },
    { ruleId: "R-SOW-005", layer: "DYNAMIC_SEASONAL", type: "SEASONAL_OVERRIDE_TRIGGER", appliesTo: "operation", ref: "spring_rapeseed_sowing", confidence: "MEDIUM" },
    { ruleId: "R-NUT-002", layer: "CANONICAL", type: "HARD_REQUIREMENT", appliesTo: "operation", ref: "boron_foliar", confidence: "HIGH" },
  ],
};

const thresholdBindings: Record<CanonicalBranchId, ThresholdBindingDraft[]> = {
  winter_rapeseed: [
    { thresholdId: "T-SOIL-01", parameter: "pH", comparator: "lt", value: 5.5, cropScope: "both", stageScope: "pre_sowing", actionOnBreach: "block_sowing", ref: "field_admission_check" },
    { thresholdId: "T-PLT-01", parameter: "leaf_count_autumn", comparator: "between", value: [6, 8], cropScope: "winter", stageScope: "autumn_care", actionOnBreach: "assess_rosette", ref: "Контроль осенней розетки" },
    { thresholdId: "T-PLT-04", parameter: "overwintering_survival", comparator: "lt", value: 40, cropScope: "winter", stageScope: "spring_renewal", actionOnBreach: "recommend_resow", ref: "Контроль перезимовки" },
  ],
  spring_rapeseed: [
    { thresholdId: "T-SOIL-01", parameter: "pH", comparator: "lt", value: 5.5, cropScope: "both", stageScope: "pre_sowing", actionOnBreach: "block_sowing", ref: "field_admission_check" },
  ],
};

export function getCanonicalBranchStages(branch: CanonicalBranchId): GenerationStageDraft[] {
  return branch === "winter_rapeseed" ? winterStages : springStages;
}

export function getCanonicalMandatoryBlocks(branch: CanonicalBranchId): string[] {
  return branch === "winter_rapeseed"
    ? [
        "field_admission_check",
        "seed_treatment",
        "post_sowing_rolling",
        "autumn_growth_regulator",
        "autumn_rosette_assessment",
        "overwintering_assessment",
        "spring_n_s_application",
        "boron_foliar",
        "harvest_with_rapeseed_header",
      ]
    : [
        "field_admission_check",
        "autumn_primary_tillage",
        "seed_treatment",
        "post_sowing_rolling",
        "flea_beetle_monitoring",
        "boron_foliar",
        "harvest_with_rapeseed_header",
      ];
}

export function getCanonicalControlPoints(branch: CanonicalBranchId): ControlPointDraft[] {
  return controlPoints[branch];
}

export function getCanonicalMonitoringSignals(branch: CanonicalBranchId): MonitoringSignalDraft[] {
  return monitoringSignals[branch];
}

export function getCanonicalRuleBindings(branch: CanonicalBranchId): RuleBindingDraft[] {
  return ruleBindings[branch];
}

export function getCanonicalThresholdBindings(branch: CanonicalBranchId): ThresholdBindingDraft[] {
  return thresholdBindings[branch];
}
