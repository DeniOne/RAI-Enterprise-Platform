-- Когнитивная память RAI: L4 Энграммы (Procedural Memory) + L3 Семантические факты (Semantic Memory)
-- Архитектурный документ: docs/07_EXECUTION/MEMORY_SYSTEM/RAI_MEMORY_ARCHITECTURE_v2.md

-- =============================================================================
-- L4: Энграммы (Procedural Memory)
-- Энграмма = минимальная единица опыта: Триггер → Действие → Результат
-- Правило Хебба: synapticWeight усиливается при повторном подтверждении
-- =============================================================================

CREATE TABLE "engrams" (
    "id" TEXT NOT NULL,

    -- Классификация
    "type" TEXT NOT NULL,          -- AGRO | BUSINESS | CLIENT | SYSTEM
    "category" TEXT NOT NULL,      -- DISEASE_TREATMENT | NUTRITION | SOWING | ...

    -- Ядро: Триггер → Действие → Результат
    "triggerConditions" JSONB NOT NULL,     -- { crop, stage, disease, weather, soil, region }
    "actionTemplate" JSONB NOT NULL,       -- { type, steps, parameters, dosage }
    "expectedOutcome" JSONB NOT NULL,      -- { metrics, thresholds, validation_period }

    -- Текстовое представление для vector search
    "content" TEXT NOT NULL,
    "embedding" vector(1536),

    -- Когнитивные метрики (правило Хебба)
    "synapticWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "activationCount" INTEGER NOT NULL DEFAULT 1,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,

    -- Когнитивный уровень (1=конкретный случай, 5=обобщённый принцип)
    "cognitiveLevel" INTEGER NOT NULL DEFAULT 1,
    "generalizability" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    -- Синаптические связи с другими энграммами
    "associations" JSONB NOT NULL DEFAULT '[]',

    -- Ключевые инсайты
    "keyInsights" TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Tenant isolation (null = глобальная энграмма / Network Memory L6)
    "companyId" TEXT,

    -- Связи с доменными сущностями
    "fieldId" TEXT,
    "cropZoneId" TEXT,
    "seasonId" TEXT,

    -- Жизненный цикл
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivatedAt" TIMESTAMP(3),
    "firstFormedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Flex-атрибуты (Carcass+Flex)
    "attrs" JSONB NOT NULL DEFAULT '{}',

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engrams_pkey" PRIMARY KEY ("id")
);

-- Индексы для энграмм: по типу, категории, весу, активности
CREATE INDEX "engrams_companyId_type_idx" ON "engrams"("companyId", "type");
CREATE INDEX "engrams_companyId_category_idx" ON "engrams"("companyId", "category");
CREATE INDEX "engrams_type_category_isActive_idx" ON "engrams"("type", "category", "isActive");
CREATE INDEX "engrams_isActive_synapticWeight_idx" ON "engrams"("isActive", "synapticWeight");

-- HNSW-индекс для vector search (cosine distance)
CREATE INDEX "engrams_embedding_idx" ON "engrams"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- L3: Семантические факты (Semantic Memory)
-- Факт = семантическая тройка: Субъект → Предикат → Объект
-- Пример: "Прозаро" → "effective_against" → "склеротиниоз"
-- =============================================================================

CREATE TABLE "semantic_facts" (
    "id" TEXT NOT NULL,

    -- Семантическая тройка
    "subject" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "object" TEXT NOT NULL,

    -- Домен
    "domain" TEXT NOT NULL,           -- phytopathology | nutrition | agronomy | chemistry | economics

    -- Метрики доверия
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT NOT NULL,           -- research | engram | expert | marketing-feed | registration

    -- Условия применимости
    "conditions" JSONB,               -- { bbch: "30-32", soilType: "суглинок", region: "ЦФО" }

    -- Срок действия
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),

    -- Текстовое представление для vector search
    "content" TEXT NOT NULL,
    "embedding" vector(1536),

    -- Tenant isolation (null = глобальный факт)
    "companyId" TEXT,

    -- Flex-атрибуты
    "attrs" JSONB NOT NULL DEFAULT '{}',

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semantic_facts_pkey" PRIMARY KEY ("id")
);

-- Индексы для семантических фактов
CREATE INDEX "semantic_facts_companyId_domain_idx" ON "semantic_facts"("companyId", "domain");
CREATE INDEX "semantic_facts_subject_idx" ON "semantic_facts"("subject");
CREATE INDEX "semantic_facts_predicate_idx" ON "semantic_facts"("predicate");
CREATE INDEX "semantic_facts_domain_confidence_idx" ON "semantic_facts"("domain", "confidence");

-- HNSW-индекс для vector search
CREATE INDEX "semantic_facts_embedding_idx" ON "semantic_facts"
    USING hnsw ("embedding" vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN-индекс для JSONB-поиска по условиям
CREATE INDEX "semantic_facts_conditions_gin_idx" ON "semantic_facts"
    USING gin ("conditions" jsonb_path_ops);

-- GIN-индекс для JSONB-поиска по trigger conditions энграмм
CREATE INDEX "engrams_triggerConditions_gin_idx" ON "engrams"
    USING gin ("triggerConditions" jsonb_path_ops);
