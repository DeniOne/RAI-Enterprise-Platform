/**
 * Canonical Guard Registry
 * 
 * This module exports the centralized registry for all canonical checks.
 * 
 * CRITICAL: This is the ONLY entry point for canonical validation.
 * Direct imports of checkMCCanon or checkGMCCanon are FORBIDDEN.
 */

export { checkCanon, CanonicalCheckParams } from './canonicalGuardRegistry';
