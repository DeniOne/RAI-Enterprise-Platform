"use strict";
/**
 * Core Role Types - Phase 0.2
 *
 * Canon: RoleContract = API между человеком и системой
 *
 * Эти типы описывают структуру контракта роли (МДР + Мотивация).
 * Используются для валидации и типизации во всей системе.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionActions = exports.CalculationPeriods = void 0;
/**
 * Calculation Period enum-like type
 */
exports.CalculationPeriods = ['daily', 'weekly', 'monthly'];
/**
 * Permission Action enum-like type
 */
exports.PermissionActions = ['create', 'read', 'update', 'delete'];
