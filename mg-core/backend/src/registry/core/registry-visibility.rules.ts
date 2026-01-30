// This file simulates a Registry Artifact (table data) defining visibility rules.
// In a full implementation, this might be loaded from the Database.

export type VisibilityScope = 'ENTITY' | 'ATTRIBUTE' | 'RELATIONSHIP' | 'VIEW';
export type RuleEffect = 'EXCLUDE' | 'INCLUDE'; // Default is INCLUDE

export interface VisibilityRule {
    scope: VisibilityScope;
    targetPattern: string; // e.g., 'secret_*', 'type:sys_*'
    roleCondition: string; // e.g., '!ADMIN', 'USER'
    effect: RuleEffect;
}

export const VISIBILITY_RULES: VisibilityRule[] = [
    // 1. Hide 'secret_' attributes from non-admins
    {
        scope: 'ATTRIBUTE',
        targetPattern: 'secret_*',
        roleCondition: '!REGISTRY_ADMIN',
        effect: 'EXCLUDE'
    },
    // 2. Hide 'internal_' attributes from non-admins
    {
        scope: 'ATTRIBUTE',
        targetPattern: 'internal_*',
        roleCondition: '!REGISTRY_ADMIN',
        effect: 'EXCLUDE'
    },
    // 3. Hide specific sensitive relationship types
    {
        scope: 'RELATIONSHIP',
        targetPattern: 'rel:sys_sensitive_*',
        roleCondition: '!REGISTRY_ADMIN',
        effect: 'EXCLUDE'
    },
    // 4. Hide 'System' entities from standard viewers
    {
        scope: 'ENTITY',
        targetPattern: 'type:sys_core',
        roleCondition: '!REGISTRY_ADMIN',
        effect: 'EXCLUDE'
    }
];
