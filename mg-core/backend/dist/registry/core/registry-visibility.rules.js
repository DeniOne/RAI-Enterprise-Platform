"use strict";
// This file simulates a Registry Artifact (table data) defining visibility rules.
// In a full implementation, this might be loaded from the Database.
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISIBILITY_RULES = void 0;
exports.VISIBILITY_RULES = [
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
