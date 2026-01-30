"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryAccessEngine = exports.RegistryAccessEngine = void 0;
const registry_visibility_rules_1 = require("./registry-visibility.rules");
const registry_rule_validator_1 = require("./registry-rule.validator");
class RegistryAccessEngine {
    rules;
    constructor(rules) {
        // use provided rules or default to global artifact
        this.rules = rules || registry_visibility_rules_1.VISIBILITY_RULES;
        // Enforce Rule Validity on Engine Instantiation (Startup)
        registry_rule_validator_1.registryRuleValidator.validateRules(this.rules);
    }
    // --- Core Matching Logic ---
    matchRule(rule, target, userRoles) {
        // 1. Check Role Condition
        let roleMatch = false;
        if (rule.roleCondition === '*') {
            roleMatch = true;
        }
        else if (rule.roleCondition.startsWith('!')) {
            const forbiddenRole = rule.roleCondition.substring(1);
            roleMatch = !userRoles.includes(forbiddenRole);
        }
        else {
            roleMatch = userRoles.includes(rule.roleCondition);
        }
        if (!roleMatch)
            return false;
        // 2. Check Target Pattern (Simple wildcard support)
        // 'secret_*' matches 'secret_code'
        const Regex = new RegExp('^' + rule.targetPattern.replace('*', '.*') + '$');
        return Regex.test(target);
    }
    getApplicableRules(scope, userRoles) {
        return this.rules.filter(r => r.scope === scope && this.checkRoleRaw(r.roleCondition, userRoles));
    }
    // Helper for Rule filtering optimization
    checkRoleRaw(condition, userRoles) {
        if (condition === '*')
            return true;
        if (condition.startsWith('!'))
            return !userRoles.includes(condition.substring(1));
        return userRoles.includes(condition);
    }
    // --- Public API: Projection Pruning ---
    /**
     * Determines if an Entity URN is accessible.
     * Used for 404 generation.
     */
    canViewEntity(user, entityUrn, entityType) {
        const roles = this.getUserRoles(user);
        // Find EXCLUDE rules that match this entity
        const rules = this.getApplicableRules('ENTITY', roles);
        for (const rule of rules) {
            // Check against URN or Type
            // Pattern might be 'type:sys_core' or just 'urn:...'
            let target = entityUrn;
            if (rule.targetPattern.startsWith('type:')) {
                target = 'type:' + entityType;
            }
            if (this.matchRule(rule, target, roles)) {
                if (rule.effect === 'EXCLUDE')
                    return false;
            }
        }
        return true;
    }
    /**
     * Filters the Schema DTO (Definitions).
     */
    pruneSchema(user, schema) {
        const roles = this.getUserRoles(user);
        // Filter Attributes
        const attrRules = this.getApplicableRules('ATTRIBUTE', roles);
        const permittedAttributes = schema.attributes.filter((attr) => {
            // If ANY partial match exclude exists, drop it? 
            // Or specific match?
            // "secret_*" excludes "secret_code"
            for (const rule of attrRules) {
                if (this.matchRule(rule, attr.code, roles) && rule.effect === 'EXCLUDE') {
                    return false;
                }
            }
            return true;
        });
        // Filter Relationships
        const relRules = this.getApplicableRules('RELATIONSHIP', roles);
        const permittedRelationships = schema.relationships.filter((rel) => {
            for (const rule of relRules) {
                // target might be relation code or 'rel:code'
                const target = 'rel:' + rel.code; // convention
                // or just code? Rule pattern 'rel:sys_*' implies prefix check
                if (this.matchRule(rule, target, roles) && rule.effect === 'EXCLUDE') {
                    return false;
                }
            }
            return true;
        });
        return {
            ...schema,
            attributes: permittedAttributes,
            relationships: permittedRelationships
        };
    }
    /**
     * Filters the Entity Data DTO (Runtime Values).
     * Ensures hidden attributes are physically removed from JSON.
     */
    pruneEntityData(user, data) {
        const roles = this.getUserRoles(user);
        const rules = this.getApplicableRules('ATTRIBUTE', roles);
        if (!data.attributes)
            return data;
        const prunedAttributes = { ...data.attributes };
        for (const key of Object.keys(prunedAttributes)) {
            for (const rule of rules) {
                if (this.matchRule(rule, key, roles) && rule.effect === 'EXCLUDE') {
                    delete prunedAttributes[key];
                    break;
                }
            }
        }
        return {
            ...data,
            attributes: prunedAttributes
        };
    }
    getUserRoles(user) {
        // Mock role extraction from JWT/User object
        // Assuming user.roles is array of strings
        return user?.roles || ['REGISTRY_USER'];
    }
}
exports.RegistryAccessEngine = RegistryAccessEngine;
exports.registryAccessEngine = new RegistryAccessEngine();
