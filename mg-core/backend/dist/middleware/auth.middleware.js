"use strict";
/**
 * Authentication Middleware
 * Handles JWT authentication using Passport
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const passport_1 = __importDefault(require("passport"));
/**
 * Middleware to authenticate requests using JWT
 */
const authenticate = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                success: false,
                error: info?.message || 'Unauthorized',
            });
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.authenticate = authenticate;
/**
 * Optional authentication - doesn't block if no token provided
 */
const optionalAuth = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};
exports.optionalAuth = optionalAuth;
