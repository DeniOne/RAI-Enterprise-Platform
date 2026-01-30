"use strict";
/**
 * Reward Types - Phase 1.3
 *
 * Canon: Reward — следствие, не причина.
 * Принцип: Одни Events → одни Rewards.
 *
 * АРХИТЕКТУРНЫЕ ПРАВИЛА:
 * 1. REWARD ≠ РЕШЕНИЕ: Engine рассчитывает, не начисляет
 * 2. ТРИГГЕРЫ: только Events (не KPI thresholds)
 * 3. ДЕТЕРМИНИЗМ: calculated_at передаётся извне
 */
Object.defineProperty(exports, "__esModule", { value: true });
