type TechMapBlueprintResource = {
  type: string;
  name: string;
  amount: number;
  unit: string;
  costPerUnit?: number;
};

type TechMapBlueprintOperation = {
  name: string;
  description: string;
  startOffsetDays: number;
  durationHours: number;
  isCritical?: boolean;
  resources: TechMapBlueprintResource[];
};

export type TechMapBlueprintStage = {
  name: string;
  sequence: number;
  aplStageId: string;
  operations: TechMapBlueprintOperation[];
};

export type TechMapBlueprint = {
  crop: string;
  generationMetadata: {
    source: "deterministic-blueprint";
    blueprintVersion: string;
    generatedAt: string;
    crop: string;
    targetYieldTHa: number;
  };
  stages: TechMapBlueprintStage[];
};

type BuildTechMapBlueprintInput = {
  crop: string;
  seasonYear: number;
  seasonStartDate?: Date | null;
  targetYieldTHa?: number | null;
};

const BLUEPRINT_VERSION = "2026.03";

function normalizeCrop(rawCrop: string): string {
  return String(rawCrop || "rapeseed").trim().toLowerCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveSeasonBaseDate(input: BuildTechMapBlueprintInput): Date {
  if (input.seasonStartDate instanceof Date && !Number.isNaN(input.seasonStartDate.getTime())) {
    return input.seasonStartDate;
  }

  return new Date(Date.UTC(input.seasonYear, 2, 10, 8, 0, 0));
}

function scaleAmount(base: number, targetYieldTHa: number, factor = 0.12): number {
  const multiplier = 1 + (targetYieldTHa - 3.2) * factor;
  return Number((base * Math.max(0.75, multiplier)).toFixed(2));
}

function buildRapeseedBlueprint(input: BuildTechMapBlueprintInput): TechMapBlueprint {
  const targetYieldTHa = clamp(input.targetYieldTHa ?? 3.2, 2.0, 5.5);

  return {
    crop: "rapeseed",
    generationMetadata: {
      source: "deterministic-blueprint",
      blueprintVersion: BLUEPRINT_VERSION,
      generatedAt: new Date().toISOString(),
      crop: "rapeseed",
      targetYieldTHa,
    },
    stages: [
      {
        name: "Анализ и подготовка",
        sequence: 1,
        aplStageId: "01_PRE_SOWING_ANALYSIS",
        operations: [
          {
            name: "Агрономический разбор поля",
            description:
              "Проверка исходных ограничений поля, влаги и предшественника перед запуском производственного цикла.",
            startOffsetDays: 0,
            durationHours: 6,
            isCritical: true,
            resources: [
              {
                type: "SERVICE",
                name: "Полевой аудит",
                amount: 1,
                unit: "unit",
                costPerUnit: 2500,
              },
            ],
          },
        ],
      },
      {
        name: "Подготовка и посев",
        sequence: 2,
        aplStageId: "04_SOWING",
        operations: [
          {
            name: "Предпосевная культивация",
            description:
              "Формирование ровного семенного ложа и закрытие влаги перед посевом.",
            startOffsetDays: 4,
            durationHours: 10,
            resources: [
              {
                type: "FUEL",
                name: "Дизельное топливо",
                amount: scaleAmount(18, targetYieldTHa, 0.04),
                unit: "l",
                costPerUnit: 68,
              },
            ],
          },
          {
            name: "Посев озимого рапса",
            description:
              "Высев семян и стартовое питание по базовой интенсивной технологии.",
            startOffsetDays: 7,
            durationHours: 12,
            isCritical: true,
            resources: [
              {
                type: "SEED",
                name: "Семена рапса",
                amount: scaleAmount(5.2, targetYieldTHa, 0.03),
                unit: "kg",
                costPerUnit: 760,
              },
              {
                type: "FERTILIZER",
                name: "Стартовый комплекс NPK",
                amount: scaleAmount(90, targetYieldTHa),
                unit: "kg",
                costPerUnit: 29,
              },
            ],
          },
        ],
      },
      {
        name: "Осеннее сопровождение",
        sequence: 3,
        aplStageId: "05_PROTECTION_EARLY",
        operations: [
          {
            name: "Гербицидная защита",
            description:
              "Сдерживание сорной растительности в раннее окно после всходов.",
            startOffsetDays: 18,
            durationHours: 6,
            resources: [
              {
                type: "PESTICIDE",
                name: "Гербицид широкого спектра",
                amount: 1.2,
                unit: "l",
                costPerUnit: 1450,
              },
              {
                type: "FUEL",
                name: "Дизельное топливо",
                amount: 7,
                unit: "l",
                costPerUnit: 68,
              },
            ],
          },
          {
            name: "Осенняя листовая подкормка",
            description:
              "Поддержка корневой системы и розетки перед уходом в зиму.",
            startOffsetDays: 26,
            durationHours: 4,
            resources: [
              {
                type: "FERTILIZER",
                name: "Бор листовой",
                amount: 1.1,
                unit: "l",
                costPerUnit: 620,
              },
            ],
          },
        ],
      },
      {
        name: "Весеннее восстановление",
        sequence: 4,
        aplStageId: "09_SPRING_RESTART",
        operations: [
          {
            name: "Первая азотная подкормка",
            description:
              "Стартовое восстановление вегетации и набор биомассы после зимовки.",
            startOffsetDays: 180,
            durationHours: 8,
            isCritical: true,
            resources: [
              {
                type: "FERTILIZER",
                name: "Аммиачная селитра",
                amount: scaleAmount(160, targetYieldTHa),
                unit: "kg",
                costPerUnit: 24,
              },
              {
                type: "FUEL",
                name: "Дизельное топливо",
                amount: 9,
                unit: "l",
                costPerUnit: 68,
              },
            ],
          },
          {
            name: "Фунгицидная защита",
            description:
              "Контроль ключевых болезней в фазе активного роста и бутонизации.",
            startOffsetDays: 205,
            durationHours: 6,
            resources: [
              {
                type: "PESTICIDE",
                name: "Фунгицид",
                amount: 0.9,
                unit: "l",
                costPerUnit: 2100,
              },
            ],
          },
        ],
      },
      {
        name: "Уборка",
        sequence: 5,
        aplStageId: "15_HARVESTING",
        operations: [
          {
            name: "Подготовка к уборке",
            description:
              "Финальный осмотр поля и проверка готовности техники и логистики.",
            startOffsetDays: 290,
            durationHours: 4,
            resources: [
              {
                type: "SERVICE",
                name: "Предуборочный осмотр",
                amount: 1,
                unit: "unit",
                costPerUnit: 1800,
              },
            ],
          },
          {
            name: "Уборка урожая",
            description:
              "Уборочная операция с фиксацией базовых ресурсов и окна исполнения.",
            startOffsetDays: 300,
            durationHours: 14,
            isCritical: true,
            resources: [
              {
                type: "FUEL",
                name: "Дизельное топливо",
                amount: scaleAmount(24, targetYieldTHa, 0.06),
                unit: "l",
                costPerUnit: 68,
              },
              {
                type: "SERVICE",
                name: "Логистика урожая",
                amount: 1,
                unit: "unit",
                costPerUnit: 6400,
              },
            ],
          },
        ],
      },
    ],
  };
}

function buildGenericBlueprint(input: BuildTechMapBlueprintInput): TechMapBlueprint {
  const normalizedCrop = normalizeCrop(input.crop);
  const targetYieldTHa = clamp(input.targetYieldTHa ?? 3.0, 1.5, 6.0);

  return {
    crop: normalizedCrop,
    generationMetadata: {
      source: "deterministic-blueprint",
      blueprintVersion: BLUEPRINT_VERSION,
      generatedAt: new Date().toISOString(),
      crop: normalizedCrop,
      targetYieldTHa,
    },
    stages: [
      {
        name: "Подготовка поля",
        sequence: 1,
        aplStageId: "01_PRE_SOWING_ANALYSIS",
        operations: [
          {
            name: "Полевой аудит",
            description: "Базовая агрономическая проверка поля и стартовых ограничений.",
            startOffsetDays: 0,
            durationHours: 6,
            isCritical: true,
            resources: [
              {
                type: "SERVICE",
                name: "Полевой аудит",
                amount: 1,
                unit: "unit",
                costPerUnit: 2200,
              },
            ],
          },
        ],
      },
      {
        name: "Посевной цикл",
        sequence: 2,
        aplStageId: "04_SOWING",
        operations: [
          {
            name: "Посев культуры",
            description: "Базовый шаблон посевной операции для демонстрации исполнения.",
            startOffsetDays: 10,
            durationHours: 10,
            isCritical: true,
            resources: [
              {
                type: "SEED",
                name: `Семена ${normalizedCrop}`,
                amount: scaleAmount(12, targetYieldTHa, 0.04),
                unit: "kg",
                costPerUnit: 210,
              },
            ],
          },
        ],
      },
      {
        name: "Поддержка и уборка",
        sequence: 3,
        aplStageId: "15_HARVESTING",
        operations: [
          {
            name: "Уборка культуры",
            description: "Финишная операция шаблона с минимальным набором ресурсов.",
            startOffsetDays: 160,
            durationHours: 12,
            isCritical: true,
            resources: [
              {
                type: "FUEL",
                name: "Дизельное топливо",
                amount: scaleAmount(20, targetYieldTHa, 0.04),
                unit: "l",
                costPerUnit: 68,
              },
            ],
          },
        ],
      },
    ],
  };
}

export function buildTechMapBlueprint(
  input: BuildTechMapBlueprintInput,
): TechMapBlueprint {
  const normalizedCrop = normalizeCrop(input.crop);

  return normalizedCrop === "rapeseed"
    ? buildRapeseedBlueprint(input)
    : buildGenericBlueprint(input);
}

export function resolveOperationWindow(
  seasonBaseDate: Date,
  startOffsetDays: number,
  durationHours: number,
): { plannedStartTime: Date; plannedEndTime: Date } {
  const plannedStartTime = new Date(seasonBaseDate);
  plannedStartTime.setUTCDate(plannedStartTime.getUTCDate() + startOffsetDays);

  const plannedEndTime = new Date(plannedStartTime);
  plannedEndTime.setUTCHours(plannedEndTime.getUTCHours() + durationHours);

  return { plannedStartTime, plannedEndTime };
}

export function resolveBlueprintBaseDate(
  input: BuildTechMapBlueprintInput,
): Date {
  return resolveSeasonBaseDate(input);
}
