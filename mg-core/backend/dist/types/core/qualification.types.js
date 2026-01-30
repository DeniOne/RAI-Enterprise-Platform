"use strict";
/**
 * Qualification Types - Phase 1.2
 *
 * Canon: Qualification Engine ТОЛЬКО оценивает, НЕ принимает решений.
 * Принцип: Одни Events + KPI → один Qualification State.
 *
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. ОЦЕНКА ≠ РЕШЕНИЕ: Engine предлагает, человек решает
 * 2. ДЕТЕРМИНИЗМ: evaluated_at передаётся извне
 * 3. EVIDENCE: каждое состояние объяснимо фактами
 */
Object.defineProperty(exports, "__esModule", { value: true });
