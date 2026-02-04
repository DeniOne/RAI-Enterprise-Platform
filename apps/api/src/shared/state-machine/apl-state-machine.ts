/**
 * APL (Agricultural Production Lifecycle) State Machine.
 * Event-Driven FSM for season stage transitions.
 *
 * PURITY: This is a pure mechanism.
 * - NO PrismaService
 * - NO @Injectable
 * - NO database access
 * - NO companyId checks
 */
import {
    StateMachine,
    TransitionDef,
    StateMetadata,
    InvalidTransitionError,
} from "./state-machine.interface";

/**
 * APL Stage enum - 16 stages of rapeseed lifecycle.
 * Matching existing AplStage values for backward compatibility.
 */
export enum AplStage {
    // ПОДГОТОВИТЕЛЬНЫЙ ЭТАП
    SOIL_PREPARATION = "01_SOIL_PREP",
    FERTILIZATION_BASE = "02_FERTILIZATION",
    SEED_PREPARATION = "03_SEED_PREP",

    // ПОСЕВНАЯ
    SOWING = "04_SOWING",
    PRE_EMERGENCE = "05_PRE_EMERGENCE",

    // ВЕГЕТАЦИЯ
    GERMINATION = "06_GERMINATION",
    ROSETTE = "07_ROSETTE",
    STEM_ELONGATION = "08_STEM_ELONGATION",

    // ЦВЕТЕНИЕ
    BUDDING = "09_BUDDING",
    FLOWERING = "10_FLOWERING",

    // СОЗРЕВАНИЕ
    POD_FORMATION = "11_POD_FORMATION",
    MATURATION = "12_MATURATION",
    FULL_MATURITY = "13_FULL_MATURITY",

    // УБОРКА
    DESICCATION = "14_DESICCATION",
    HARVEST = "15_HARVEST",
    POST_HARVEST = "16_POST_HARVEST",
}

/**
 * APL Events that trigger stage transitions.
 */
export enum AplEvent {
    // Sequential progression events
    ADVANCE = "ADVANCE",           // Move to next stage
    SKIP_DESICCATION = "SKIP_DESICCATION", // Skip optional desiccation stage

    // Control events
    ABORT = "ABORT",               // Abort season (any stage → terminal)
}

/**
 * Season entity shape for FSM (minimal interface).
 */
export interface SeasonEntity {
    id: string;
    currentStageId: AplStage | null;
}

/**
 * State metadata for APL stages.
 */
export const APL_STATE_METADATA: Record<AplStage, StateMetadata<AplStage>> = {
    [AplStage.SOIL_PREPARATION]: {
        id: AplStage.SOIL_PREPARATION,
        name: "Soil Preparation",
        nameRu: "Подготовка почвы",
        order: 1,
        isTerminal: false,
    },
    [AplStage.FERTILIZATION_BASE]: {
        id: AplStage.FERTILIZATION_BASE,
        name: "Base Fertilization",
        nameRu: "Базовое удобрение",
        order: 2,
        isTerminal: false,
    },
    [AplStage.SEED_PREPARATION]: {
        id: AplStage.SEED_PREPARATION,
        name: "Seed Preparation",
        nameRu: "Подготовка семян",
        order: 3,
        isTerminal: false,
    },
    [AplStage.SOWING]: {
        id: AplStage.SOWING,
        name: "Sowing",
        nameRu: "Посев",
        order: 4,
        isTerminal: false,
    },
    [AplStage.PRE_EMERGENCE]: {
        id: AplStage.PRE_EMERGENCE,
        name: "Pre-Emergence",
        nameRu: "Довсходовый период",
        order: 5,
        isTerminal: false,
    },
    [AplStage.GERMINATION]: {
        id: AplStage.GERMINATION,
        name: "Germination",
        nameRu: "Всходы",
        order: 6,
        isTerminal: false,
    },
    [AplStage.ROSETTE]: {
        id: AplStage.ROSETTE,
        name: "Rosette",
        nameRu: "Розетка листьев",
        order: 7,
        isTerminal: false,
    },
    [AplStage.STEM_ELONGATION]: {
        id: AplStage.STEM_ELONGATION,
        name: "Stem Elongation",
        nameRu: "Стеблевание",
        order: 8,
        isTerminal: false,
    },
    [AplStage.BUDDING]: {
        id: AplStage.BUDDING,
        name: "Budding",
        nameRu: "Бутонизация",
        order: 9,
        isTerminal: false,
    },
    [AplStage.FLOWERING]: {
        id: AplStage.FLOWERING,
        name: "Flowering",
        nameRu: "Цветение",
        order: 10,
        isTerminal: false,
    },
    [AplStage.POD_FORMATION]: {
        id: AplStage.POD_FORMATION,
        name: "Pod Formation",
        nameRu: "Образование стручков",
        order: 11,
        isTerminal: false,
    },
    [AplStage.MATURATION]: {
        id: AplStage.MATURATION,
        name: "Maturation",
        nameRu: "Созревание",
        order: 12,
        isTerminal: false,
    },
    [AplStage.FULL_MATURITY]: {
        id: AplStage.FULL_MATURITY,
        name: "Full Maturity",
        nameRu: "Полная спелость",
        order: 13,
        isTerminal: false,
    },
    [AplStage.DESICCATION]: {
        id: AplStage.DESICCATION,
        name: "Desiccation",
        nameRu: "Десикация",
        order: 14,
        isTerminal: false,
    },
    [AplStage.HARVEST]: {
        id: AplStage.HARVEST,
        name: "Harvest",
        nameRu: "Уборка",
        order: 15,
        isTerminal: false,
    },
    [AplStage.POST_HARVEST]: {
        id: AplStage.POST_HARVEST,
        name: "Post-Harvest",
        nameRu: "Послеуборочная обработка",
        order: 16,
        isTerminal: true,
    },
};

/**
 * Valid stage transitions for APL.
 * Linear progression with optional desiccation skip.
 */
const APL_TRANSITIONS: TransitionDef<AplStage, AplEvent>[] = [
    // Linear progression via ADVANCE event
    { from: AplStage.SOIL_PREPARATION, event: AplEvent.ADVANCE, to: AplStage.FERTILIZATION_BASE },
    { from: AplStage.FERTILIZATION_BASE, event: AplEvent.ADVANCE, to: AplStage.SEED_PREPARATION },
    { from: AplStage.SEED_PREPARATION, event: AplEvent.ADVANCE, to: AplStage.SOWING },
    { from: AplStage.SOWING, event: AplEvent.ADVANCE, to: AplStage.PRE_EMERGENCE },
    { from: AplStage.PRE_EMERGENCE, event: AplEvent.ADVANCE, to: AplStage.GERMINATION },
    { from: AplStage.GERMINATION, event: AplEvent.ADVANCE, to: AplStage.ROSETTE },
    { from: AplStage.ROSETTE, event: AplEvent.ADVANCE, to: AplStage.STEM_ELONGATION },
    { from: AplStage.STEM_ELONGATION, event: AplEvent.ADVANCE, to: AplStage.BUDDING },
    { from: AplStage.BUDDING, event: AplEvent.ADVANCE, to: AplStage.FLOWERING },
    { from: AplStage.FLOWERING, event: AplEvent.ADVANCE, to: AplStage.POD_FORMATION },
    { from: AplStage.POD_FORMATION, event: AplEvent.ADVANCE, to: AplStage.MATURATION },
    { from: AplStage.MATURATION, event: AplEvent.ADVANCE, to: AplStage.FULL_MATURITY },
    { from: AplStage.FULL_MATURITY, event: AplEvent.ADVANCE, to: AplStage.DESICCATION },
    { from: AplStage.DESICCATION, event: AplEvent.ADVANCE, to: AplStage.HARVEST },
    { from: AplStage.HARVEST, event: AplEvent.ADVANCE, to: AplStage.POST_HARVEST },

    // Optional: Skip desiccation (direct to harvest)
    { from: AplStage.FULL_MATURITY, event: AplEvent.SKIP_DESICCATION, to: AplStage.HARVEST },
];

/**
 * APL State Machine implementation.
 */
class AplStateMachineImpl implements StateMachine<SeasonEntity, AplStage | null, AplEvent> {
    private transitionMap: Map<string, AplStage>;

    constructor() {
        this.transitionMap = new Map();
        for (const t of APL_TRANSITIONS) {
            const key = `${t.from}|${t.event}`;
            this.transitionMap.set(key, t.to);
        }
    }

    canTransition(state: AplStage | null, event: AplEvent): boolean {
        if (state === null) return false;
        const key = `${state}|${event}`;
        return this.transitionMap.has(key);
    }

    transition(entity: SeasonEntity, event: AplEvent): SeasonEntity {
        if (entity.currentStageId === null) {
            throw new InvalidTransitionError("null", event);
        }

        const key = `${entity.currentStageId}|${event}`;
        const targetState = this.transitionMap.get(key);

        if (!targetState) {
            throw new InvalidTransitionError(entity.currentStageId, event);
        }

        // Return NEW entity (immutable)
        return {
            ...entity,
            currentStageId: targetState,
        };
    }

    getAvailableEvents(state: AplStage | null): AplEvent[] {
        if (state === null) return [];
        const events: AplEvent[] = [];
        for (const t of APL_TRANSITIONS) {
            if (t.from === state && !events.includes(t.event)) {
                events.push(t.event);
            }
        }
        return events;
    }

    getState(entity: SeasonEntity): AplStage | null {
        return entity.currentStageId;
    }

    isTerminal(state: AplStage | null): boolean {
        if (state === null) return false;
        return APL_STATE_METADATA[state].isTerminal;
    }

    /**
     * Get the initial stage for a new season.
     */
    getInitialStage(): AplStage {
        return AplStage.SOIL_PREPARATION;
    }

    /**
     * Get stage metadata for display.
     */
    getStageMetadata(stage: AplStage): StateMetadata<AplStage> {
        return APL_STATE_METADATA[stage];
    }
}

/**
 * Singleton instance of APL State Machine.
 * Use this instead of creating new instances.
 */
export const AplStateMachine = new AplStateMachineImpl();
