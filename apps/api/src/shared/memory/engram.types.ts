/**
 * Типы для системы энграмм (L4 — Procedural Memory).
 * Энграмма = минимальная неделимая единица опыта: Триггер → Действие → Результат.
 */

// --- Классификация ---

export type EngramType = 'AGRO' | 'BUSINESS' | 'CLIENT' | 'SYSTEM';

export type EngramCategory =
  | 'DISEASE_TREATMENT'
  | 'PEST_CONTROL'
  | 'NUTRITION'
  | 'SOWING'
  | 'HARVEST'
  | 'WEATHER_RESPONSE'
  | 'DEVIATION_OUTCOME'
  | 'PRICING_STRATEGY'
  | 'CLIENT_PATTERN'
  | 'SYSTEM_OPTIMIZATION';

// --- Ядро: Триггер → Действие → Результат ---

export interface EngramTriggerConditions {
  /** Культура */
  crop?: string;
  /** Фаза BBCH */
  bbchStage?: string;
  /** Болезнь или вредитель */
  threat?: string;
  /** Уровень поражения */
  severity?: string;
  /** Погодные условия */
  weather?: Record<string, unknown>;
  /** Тип почвы */
  soilType?: string;
  /** Регион */
  region?: string;
  /** Произвольные условия */
  [key: string]: unknown;
}

export interface EngramActionTemplate {
  /** Тип действия */
  type: 'TREATMENT' | 'APPLICATION' | 'ADJUSTMENT' | 'ALERT' | 'RECOMMENDATION' | 'SEASONAL_RESULT';
  /** Шаги */
  steps?: string[];
  /** Параметры (препарат, дозировка и т.п.) */
  parameters?: Record<string, unknown>;
}

export interface EngramExpectedOutcome {
  /** Метрики успеха */
  metrics?: Record<string, number>;
  /** Пороги */
  thresholds?: Record<string, number>;
  /** Период валидации (дни) */
  validationPeriodDays?: number;
  /** Описание */
  description?: string;
}

// --- Ввод/Вывод ---

export interface EngramCaseStudy {
  companyId?: string;
  type: EngramType;
  category: EngramCategory;
  triggerConditions: EngramTriggerConditions;
  actionTemplate: EngramActionTemplate;
  expectedOutcome: EngramExpectedOutcome;
  keyInsights?: string[];
  fieldId?: string;
  cropZoneId?: string;
  seasonId?: string;
  /** Результат: успех или неудача */
  wasSuccessful: boolean;
}

export interface EngramRecallContext {
  companyId: string;
  embedding: number[];
  /** Фильтры для сужения поиска */
  filters?: {
    type?: EngramType;
    category?: EngramCategory;
    crop?: string;
    region?: string;
    isActive?: boolean;
  };
  limit?: number;
  minSimilarity?: number;
}

export interface RankedEngram {
  id: string;
  type: EngramType;
  category: EngramCategory;
  content: string;
  triggerConditions: EngramTriggerConditions;
  actionTemplate: EngramActionTemplate;
  expectedOutcome: EngramExpectedOutcome;
  keyInsights: string[];
  /** Составной балл = weight*0.4 + successRate*0.3 + similarity*0.3 */
  compositeScore: number;
  synapticWeight: number;
  successRate: number;
  similarity: number;
  activationCount: number;
  cognitiveLevel: number;
}

export interface EngramEvidence {
  /** Описание доказательства */
  description: string;
  /** Успех или неудача */
  wasSuccessful: boolean;
  /** Какие метрики изменились */
  metrics?: Record<string, number>;
  /** Источник */
  source: string;
}

// --- Синаптические связи ---

export type AssociationType = 'CAUSAL' | 'CONTEXTUAL' | 'TEMPORAL';

export interface EngramAssociation {
  engramId: string;
  strength: number;
  type: AssociationType;
}

// --- Пороги для обрезки ---

export interface PruneThreshold {
  /** Минимальный вес для сохранения */
  minWeight: number;
  /** Максимальное время без активации (дни) */
  maxInactiveDays: number;
}
