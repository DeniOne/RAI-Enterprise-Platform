"use strict";
/**
 * KPI Types - Phase 1.1
 *
 * Canon: KPI рассчитываются ТОЛЬКО из Events.
 * Принцип: Один и тот же набор Events → всегда один и тот же KPI.
 *
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. ДЕТЕРМИНИЗМ: calculated_at передаётся извне, не влияет на расчёт
 * 2. РАЗДЕЛЕНИЕ: Engine фильтрует → Formula считает
 * 3. ЧИСТОТА: нет состояния, нет side effects
 */
Object.defineProperty(exports, "__esModule", { value: true });
