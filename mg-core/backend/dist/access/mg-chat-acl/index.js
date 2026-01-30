"use strict";
/**
 * ACL Mapping Layer — Public API
 *
 * Экспорт всех публичных типов и функций.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACLOutOfScopeError = exports.ACLForbiddenError = exports.aclMiddleware = exports.resolveACL = exports.MG_CHAT_ACL_POLICY = void 0;
var acl_policy_1 = require("./acl.policy");
Object.defineProperty(exports, "MG_CHAT_ACL_POLICY", { enumerable: true, get: function () { return acl_policy_1.MG_CHAT_ACL_POLICY; } });
var acl_resolver_1 = require("./acl.resolver");
Object.defineProperty(exports, "resolveACL", { enumerable: true, get: function () { return acl_resolver_1.resolveACL; } });
var acl_middleware_1 = require("./acl.middleware");
Object.defineProperty(exports, "aclMiddleware", { enumerable: true, get: function () { return acl_middleware_1.aclMiddleware; } });
Object.defineProperty(exports, "ACLForbiddenError", { enumerable: true, get: function () { return acl_middleware_1.ACLForbiddenError; } });
Object.defineProperty(exports, "ACLOutOfScopeError", { enumerable: true, get: function () { return acl_middleware_1.ACLOutOfScopeError; } });
