/**
 * ACL Mapping Layer — Public API
 * 
 * Экспорт всех публичных типов и функций.
 */

export type {
    ManagementContour,
    AccessScope,
    AccessContext,
    ACLDecision,
    ACLPolicyRule,
    ACLPolicy
} from "./acl.types";

export { MG_CHAT_ACL_POLICY } from "./acl.policy";

export { resolveACL } from "./acl.resolver";

export {
    aclMiddleware,
    ACLForbiddenError,
    ACLOutOfScopeError,
    type ACLMiddlewareInput
} from "./acl.middleware";
