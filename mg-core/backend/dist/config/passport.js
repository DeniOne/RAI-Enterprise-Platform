"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const auth_service_1 = require("@/core/identity/auth.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authService = new auth_service_1.AuthService();
const options = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
};
exports.jwtStrategy = new passport_jwt_1.Strategy(options, async (payload, done) => {
    try {
        const user = await authService.validateUser(payload);
        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    }
    catch (error) {
        return done(error, false);
    }
});
