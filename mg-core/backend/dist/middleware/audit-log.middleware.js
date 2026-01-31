"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogMiddleware = void 0;
const audit_log_service_1 = __importDefault(require("@/core/flow/audit-log.service"));
const auditLogMiddleware = (req, res, next) => {
    // Log only state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // We use a slight delay or fire-and-forget to not block the request
        // Also we try to get user from req.user (populated by passport)
        // Note: middleware order matters. This should be after auth middleware if we want user info.
        const user = req.user;
        const userId = user ? user.id : undefined;
        audit_log_service_1.default.createLog({
            userId,
            action: `${req.method} ${req.originalUrl}`,
            details: {
                body: req.body,
                query: req.query,
                params: req.params
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });
    }
    next();
};
exports.auditLogMiddleware = auditLogMiddleware;
