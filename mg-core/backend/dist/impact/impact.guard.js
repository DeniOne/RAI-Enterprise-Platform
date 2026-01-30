"use strict";
/**
 * Entity Card Impact Guard (Step 11 Security)
 *
 * Enforces security rules for Impact Analysis.
 * Extends Registry Graph Security principles.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityCardImpactGuard = exports.EntityCardImpactGuard = void 0;
class EntityCardImpactGuard {
    /**
     * Validate Impact View match.
     */
    validateImpactContext(card, viewName) {
        const view = card.views[viewName];
        if (!view) {
            throw new Error(`Impact view "${viewName}" not found for entity ${card.entityType}`);
        }
        if (view.type !== 'impact') {
            throw new Error(`View "${viewName}" is not an impact view (type: ${view.type})`);
        }
        if (view.root !== card.entityType) {
            throw new Error(`Security Violation: View "${viewName}" declares root "${view.root}" but was requested for "${card.entityType}"`);
        }
        // Additional checks: maxDepth > allowed limits?
        if (view.maxDepth && view.maxDepth > 5) {
            throw new Error(`Security Violation: Max depth ${view.maxDepth} exceeds hard limit 5`);
        }
        return view;
    }
}
exports.EntityCardImpactGuard = EntityCardImpactGuard;
exports.entityCardImpactGuard = new EntityCardImpactGuard();
