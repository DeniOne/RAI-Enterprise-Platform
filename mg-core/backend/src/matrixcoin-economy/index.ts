/**
 * MatrixCoin-Economy Module Barrel Export
 * Module 08 — Internal Economy System
 * 
 * ⚠️ CANONICAL CONSTRAINTS:
 * - MC ≠ money, MC = временный след участия
 * - GMC ≠ reward, GMC = стратегический статусный актив признания
 * - AI = read-only, advisory only
 * - NO automation, NO cron, NO farming
 */

// Core Types & Constants
export * from './core';

// Guards (Boundary Protection)
export * from './guards';

// DTOs
export * from './dto';

// Service Interfaces
export * from './services';
