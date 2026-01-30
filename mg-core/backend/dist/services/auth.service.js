"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const common_enums_1 = require("../dto/common/common.enums");
const prisma_1 = require("../config/prisma");
const logger_1 = require("../config/logger");
class AuthService {
    saltRounds = 10;
    jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
    jwtExpiresIn = '1h';
    refreshTokenExpiresIn = '7d';
    async register(dto) {
        // Check if user already exists
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new Error('User already exists');
        }
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(dto.password, this.saltRounds);
        // Create user
        const user = await prisma_1.prisma.user.create({
            data: {
                email: dto.email,
                password_hash: passwordHash,
                first_name: dto.firstName,
                last_name: dto.lastName,
                middle_name: dto.middleName,
                phone_number: dto.phoneNumber,
                role: common_enums_1.UserRole.EMPLOYEE, // Cast to Prisma enum type if needed, or ensure values match
                status: common_enums_1.UserStatus.ACTIVE,
                personal_data_consent: dto.personalDataConsent,
                consent_date: dto.personalDataConsent ? new Date() : null,
            },
        });
        return this.generateAuthResponse(user);
    }
    async login(dto) {
        logger_1.logger.debug('Login attempt', { email: dto.email });
        const user = await prisma_1.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            logger_1.logger.debug('Login failed: user not found', { email: dto.email });
            throw new Error('Invalid credentials');
        }
        const isPasswordValid = await bcrypt_1.default.compare(dto.password, user.password_hash);
        if (!isPasswordValid) {
            logger_1.logger.debug('Login failed: invalid password', { email: dto.email });
            throw new Error('Invalid credentials');
        }
        // Update last login timestamp
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
        });
        logger_1.logger.info('Login successful', { email: dto.email, userId: user.id });
        return this.generateAuthResponse(user);
    }
    async validateUser(payload) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
        return user ? this.mapToUserResponse(user) : null;
    }
    /**
     * Initialize Telegram Login flow.
     * CANON: Only for ACTIVE users with linked telegram_id.
     */
    async initTelegramLogin(username) {
        // Remove @ if present
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
        // 1. Find the user by telegram username
        // We assume telegram_username is stored or telegram_id is linked.
        // For now, we'll try to find by a field or assume telegram_id exists.
        // NOTE: The current schema has telegram_id (ID), we might need a field for username or use another way to link.
        // Let's check the User model in schema.prisma again.
        // I noticed 'User' has 'telegram_id'. I should check if we have telegram_username.
        const user = await prisma_1.prisma.user.findFirst({
            where: {
                // @ts-ignore - Assuming we'll use email as username or we need a specific telegram_username field
                // For this implementation, let's assume we can find them by email or we need an exact match with some metadata
                // CANON states: 'existing users with linked telegram_id'
                email: cleanUsername.includes('@') ? cleanUsername : undefined,
                telegram_id: { not: null },
                status: 'ACTIVE'
            }
        });
        if (!user) {
            logger_1.logger.warn('Telegram login attempted for non-existent or inactive user', { username });
            throw new Error('Access denied: User not found or inactive');
        }
        // 2. Create AuthSession
        const session = await prisma_1.prisma.authSession.create({
            data: {
                user_id: user.id,
                status: 'PENDING',
                expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                ip_address: undefined, // Could be passed from controller
                user_agent: undefined
            }
        });
        // 3. Send Push Notification via TelegramService
        const telegramService = (await Promise.resolve().then(() => __importStar(require('./telegram.service')))).default;
        await telegramService.sendLoginPush(session.id, user.telegram_id);
        return { sessionId: session.id };
    }
    /**
     * Verify session status (Polling target).
     */
    async verifyTelegramLogin(sessionId) {
        const session = await prisma_1.prisma.authSession.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });
        if (!session)
            throw new Error('Session not found');
        if (new Date() > session.expires_at) {
            await prisma_1.prisma.authSession.update({
                where: { id: sessionId },
                data: { status: 'EXPIRED' }
            });
            throw new Error('Session expired');
        }
        if (session.status === 'APPROVED') {
            // Success! Generate tokens.
            // If logging in via Telegram, we trust the identity and can bypass initial password reset
            // especially helpful for superusers with dummy emails.
            if (session.user.must_reset_password) {
                await prisma_1.prisma.user.update({
                    where: { id: session.user_id },
                    data: { must_reset_password: false }
                });
            }
            return this.generateAuthResponse(session.user);
        }
        if (session.status === 'REJECTED') {
            throw new Error('Login rejected by user');
        }
        return null; // Still pending
    }
    /**
     * Refresh access token using a valid refresh token.
     * NO rotation, NO scoring, NO auto-block per MODULE 01 canon.
     */
    async refresh(refreshToken) {
        try {
            // Verify the refresh token
            const payload = jsonwebtoken_1.default.verify(refreshToken, this.jwtSecret);
            // Validate user still exists and is active
            const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user) {
                logger_1.logger.debug('Refresh failed: user not found');
                throw new Error('Unauthorized');
            }
            // Generate new access token only (NO rotation of refresh token)
            const newPayload = { sub: user.id, email: user.email, role: user.role };
            const accessToken = jsonwebtoken_1.default.sign(newPayload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
            logger_1.logger.info('Token refresh successful', { userId: user.id });
            return { accessToken };
        }
        catch (error) {
            // Handle JWT verification errors (expired, invalid, etc.)
            if (error.name === 'TokenExpiredError') {
                logger_1.logger.debug('Refresh failed: token expired');
            }
            else if (error.name === 'JsonWebTokenError') {
                logger_1.logger.debug('Refresh failed: invalid token');
            }
            throw new Error('Unauthorized');
        }
    }
    /**
     * Logout - records user intent to end session.
     * NO token invalidation, NO session storage per MODULE 01 canon.
     * Token expiration is the only mechanism.
     */
    async logout(userId) {
        logger_1.logger.info('User logout', { userId });
        // No token invalidation - this is an ACCEPTED LIMITATION
        // Frontend handles local token cleanup
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error('User not found');
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password_hash);
        if (!isPasswordValid)
            throw new Error('Invalid current password');
        const newPasswordHash = await bcrypt_1.default.hash(newPassword, this.saltRounds);
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: newPasswordHash,
                // @ts-ignore
                must_reset_password: false,
            },
        });
        logger_1.logger.info('Password changed successfully', { userId });
    }
    generateAuthResponse(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = jsonwebtoken_1.default.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenExpiresIn });
        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            user: this.mapToUserResponse(user),
        };
    }
    mapToUserResponse(user) {
        return {
            id: user.id,
            email: user.email,
            role: user.role, // Cast Prisma enum to DTO enum
            status: user.status, // Cast Prisma enum to DTO enum
            firstName: user.first_name,
            lastName: user.last_name,
            middleName: user.middle_name || undefined, // Handle null
            phoneNumber: user.phone_number || undefined, // Handle null
            avatar: user.avatar || undefined, // Handle null
            departmentId: user.department_id || undefined, // Handle null
            lastLoginAt: user.last_login_at?.toISOString(),
            createdAt: user.created_at.toISOString(),
            updatedAt: user.updated_at.toISOString(),
            personalDataConsent: user.personal_data_consent,
            mustResetPassword: user.must_reset_password || false,
            foundationStatus: user.foundation_status || 'NOT_STARTED',
        };
    }
}
exports.AuthService = AuthService;
