"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireRoles = void 0;
/**
 * Middleware to check if user has required role(s)
 * @param roles - Array of allowed roles
 */
const requireRoles = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions',
                requiredRoles: roles,
                userRole: user.role
            });
        }
        next();
    };
};
exports.requireRoles = requireRoles;
/**
 * Alternative function name for convenience
 * @param roles - Array of allowed roles as strings
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden: Insufficient permissions',
                requiredRoles: roles,
                userRole: user.role
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
