/**
 * APL Stage definitions for rapeseed (Рапс) lifecycle.
 * These are the 16 stages based on AGRICULTURAL_ONTOLOGY.
 * 
 * @see docs/02-DOMAINS/AGRICULTURAL_ONTOLOGY.md
 */
export enum AplStage {
    // ПОДГОТОВИТЕЛЬНЫЙ ЭТАП
    SOIL_PREPARATION = "01_SOIL_PREP",           // Подготовка почвы
    FERTILIZATION_BASE = "02_FERTILIZATION",     // Базовое удобрение
    SEED_PREPARATION = "03_SEED_PREP",           // Подготовка семян

    // ПОСЕВНАЯ
    SOWING = "04_SOWING",                        // Посев
    PRE_EMERGENCE = "05_PRE_EMERGENCE",          // Довсходовый период

    // ВЕГЕТАЦИЯ
    GERMINATION = "06_GERMINATION",              // Всходы
    ROSETTE = "07_ROSETTE",                      // Розетка листьев
    STEM_ELONGATION = "08_STEM_ELONGATION",      // Стеблевание

    // ЦВЕТЕНИЕ
    BUDDING = "09_BUDDING",                      // Бутонизация
    FLOWERING = "10_FLOWERING",                  // Цветение

    // СОЗРЕВАНИЕ
    POD_FORMATION = "11_POD_FORMATION",          // Образование стручков
    MATURATION = "12_MATURATION",                // Созревание
    FULL_MATURITY = "13_FULL_MATURITY",          // Полная спелость

    // УБОРКА
    DESICCATION = "14_DESICCATION",              // Десикация (опционально)
    HARVEST = "15_HARVEST",                      // Уборка
    POST_HARVEST = "16_POST_HARVEST",            // Послеуборочная обработка
}

/**
 * Stage metadata for FSM transitions.
 */
export interface StageMetadata {
    id: AplStage;
    name: string;
    nameRu: string;
    order: number;
    allowedTransitions: AplStage[];
}

/**
 * APL Stage definitions with transition rules.
 */
export const STAGE_DEFINITIONS: Record<AplStage, StageMetadata> = {
    [AplStage.SOIL_PREPARATION]: {
        id: AplStage.SOIL_PREPARATION,
        name: "Soil Preparation",
        nameRu: "Подготовка почвы",
        order: 1,
        allowedTransitions: [AplStage.FERTILIZATION_BASE],
    },
    [AplStage.FERTILIZATION_BASE]: {
        id: AplStage.FERTILIZATION_BASE,
        name: "Base Fertilization",
        nameRu: "Базовое удобрение",
        order: 2,
        allowedTransitions: [AplStage.SEED_PREPARATION],
    },
    [AplStage.SEED_PREPARATION]: {
        id: AplStage.SEED_PREPARATION,
        name: "Seed Preparation",
        nameRu: "Подготовка семян",
        order: 3,
        allowedTransitions: [AplStage.SOWING],
    },
    [AplStage.SOWING]: {
        id: AplStage.SOWING,
        name: "Sowing",
        nameRu: "Посев",
        order: 4,
        allowedTransitions: [AplStage.PRE_EMERGENCE],
    },
    [AplStage.PRE_EMERGENCE]: {
        id: AplStage.PRE_EMERGENCE,
        name: "Pre-Emergence",
        nameRu: "Довсходовый период",
        order: 5,
        allowedTransitions: [AplStage.GERMINATION],
    },
    [AplStage.GERMINATION]: {
        id: AplStage.GERMINATION,
        name: "Germination",
        nameRu: "Всходы",
        order: 6,
        allowedTransitions: [AplStage.ROSETTE],
    },
    [AplStage.ROSETTE]: {
        id: AplStage.ROSETTE,
        name: "Rosette",
        nameRu: "Розетка листьев",
        order: 7,
        allowedTransitions: [AplStage.STEM_ELONGATION],
    },
    [AplStage.STEM_ELONGATION]: {
        id: AplStage.STEM_ELONGATION,
        name: "Stem Elongation",
        nameRu: "Стеблевание",
        order: 8,
        allowedTransitions: [AplStage.BUDDING],
    },
    [AplStage.BUDDING]: {
        id: AplStage.BUDDING,
        name: "Budding",
        nameRu: "Бутонизация",
        order: 9,
        allowedTransitions: [AplStage.FLOWERING],
    },
    [AplStage.FLOWERING]: {
        id: AplStage.FLOWERING,
        name: "Flowering",
        nameRu: "Цветение",
        order: 10,
        allowedTransitions: [AplStage.POD_FORMATION],
    },
    [AplStage.POD_FORMATION]: {
        id: AplStage.POD_FORMATION,
        name: "Pod Formation",
        nameRu: "Образование стручков",
        order: 11,
        allowedTransitions: [AplStage.MATURATION],
    },
    [AplStage.MATURATION]: {
        id: AplStage.MATURATION,
        name: "Maturation",
        nameRu: "Созревание",
        order: 12,
        allowedTransitions: [AplStage.FULL_MATURITY],
    },
    [AplStage.FULL_MATURITY]: {
        id: AplStage.FULL_MATURITY,
        name: "Full Maturity",
        nameRu: "Полная спелость",
        order: 13,
        allowedTransitions: [AplStage.DESICCATION, AplStage.HARVEST],
    },
    [AplStage.DESICCATION]: {
        id: AplStage.DESICCATION,
        name: "Desiccation",
        nameRu: "Десикация",
        order: 14,
        allowedTransitions: [AplStage.HARVEST],
    },
    [AplStage.HARVEST]: {
        id: AplStage.HARVEST,
        name: "Harvest",
        nameRu: "Уборка",
        order: 15,
        allowedTransitions: [AplStage.POST_HARVEST],
    },
    [AplStage.POST_HARVEST]: {
        id: AplStage.POST_HARVEST,
        name: "Post-Harvest",
        nameRu: "Послеуборочная обработка",
        order: 16,
        allowedTransitions: [], // Terminal stage
    },
};

/**
 * Get the first stage (entry point).
 */
export function getInitialStage(): AplStage {
    return AplStage.SOIL_PREPARATION;
}

/**
 * Check if stage transition is valid.
 */
export function isValidTransition(from: AplStage, to: AplStage): boolean {
    const metadata = STAGE_DEFINITIONS[from];
    return metadata.allowedTransitions.includes(to);
}

/**
 * Get next possible stages.
 */
export function getNextStages(current: AplStage): AplStage[] {
    return STAGE_DEFINITIONS[current].allowedTransitions;
}

/**
 * Check if stage is terminal.
 */
export function isTerminalStage(stage: AplStage): boolean {
    return STAGE_DEFINITIONS[stage].allowedTransitions.length === 0;
}
