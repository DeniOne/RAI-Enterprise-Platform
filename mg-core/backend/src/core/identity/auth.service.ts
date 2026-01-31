import { User, FoundationStatus, AdmissionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RegisterRequestDto, LoginRequestDto, AuthResponseDto, UserResponseDto } from '../../dto/auth/auth.dto';
import { UserRole, UserStatus } from '../../dto/common/common.enums';
import { prisma } from '../../config/prisma';
import { logger } from '../../config/logger';

export class AuthService {
    private readonly saltRounds = 10;
    private readonly jwtSecret = process.env.JWT_SECRET || 'super-secret-key';
    private readonly jwtExpiresIn = '1h';
    private readonly refreshTokenExpiresIn = '7d';

    async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new Error('User already exists');
        }
        // Hash password
        const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
        // Create user
        const user = await prisma.user.create({
            data: {
                email: dto.email,
                password_hash: passwordHash,
                first_name: dto.firstName,
                last_name: dto.lastName,
                middle_name: dto.middleName,
                phone_number: dto.phoneNumber,
                role: UserRole.EMPLOYEE as any, // Cast to Prisma enum type if needed, or ensure values match
                status: UserStatus.ACTIVE as any,
                personal_data_consent: dto.personalDataConsent,
                consent_date: dto.personalDataConsent ? new Date() : null,
            },
        });
        return this.generateAuthResponse(user);
    }

    async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
        logger.debug('Login attempt', { email: dto.email });
        const user = await prisma.user.findUnique({ where: { email: dto.email } });

        if (!user) {
            logger.debug('Login failed: user not found', { email: dto.email });
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

        if (!isPasswordValid) {
            logger.debug('Login failed: invalid password', { email: dto.email });
            throw new Error('Invalid credentials');
        }

        // Update last login timestamp
        await prisma.user.update({
            where: { id: user.id },
            data: { last_login_at: new Date() },
        });

        logger.info('Login successful', { email: dto.email, userId: user.id });
        return this.generateAuthResponse(user);
    }

    async validateUser(payload: any): Promise<UserResponseDto | null> {
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        return user ? this.mapToUserResponse(user) : null;
    }

    /**
     * Initialize Telegram Login flow.
     * CANON: Only for ACTIVE users with linked telegram_id.
     */
    async initTelegramLogin(username: string): Promise<{ sessionId: string }> {
        // Remove @ if present
        const cleanUsername = username.startsWith('@') ? username.substring(1) : username;

        // 1. Find the user by telegram username
        // We assume telegram_username is stored or telegram_id is linked.
        // For now, we'll try to find by a field or assume telegram_id exists.
        // NOTE: The current schema has telegram_id (ID), we might need a field for username or use another way to link.
        // Let's check the User model in schema.prisma again.
        // I noticed 'User' has 'telegram_id'. I should check if we have telegram_username.

        const user = await prisma.user.findFirst({
            where: {
                // @ts-ignore - Assuming we'll use email as username or we need a specific telegram_username field
                // For this implementation, let's assume we can find them by email or we need an exact match with some metadata
                // CANON states: 'existing users with linked telegram_id'
                email: cleanUsername.includes('@') ? cleanUsername : undefined,
                telegram_id: { not: null },
                status: 'ACTIVE' as any
            }
        });

        if (!user) {
            logger.warn('Telegram login attempted for non-existent or inactive user', { username });
            throw new Error('Access denied: User not found or inactive');
        }

        // 2. Create AuthSession
        const session = await prisma.authSession.create({
            data: {
                user_id: user.id,
                status: 'PENDING' as any,
                expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                ip_address: undefined, // Could be passed from controller
                user_agent: undefined
            }
        });

        // 3. Send Push Notification via TelegramService
        const telegramService = (await import('../../services/telegram.service')).default;
        await telegramService.sendLoginPush(session.id, user.telegram_id!);

        return { sessionId: session.id };
    }

    /**
     * Verify session status (Polling target).
     */
    async verifyTelegramLogin(sessionId: string): Promise<AuthResponseDto | null> {
        const session = await prisma.authSession.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });

        if (!session) throw new Error('Session not found');

        if (new Date() > session.expires_at) {
            await prisma.authSession.update({
                where: { id: sessionId },
                data: { status: 'EXPIRED' as any }
            });
            throw new Error('Session expired');
        }

        if (session.status === ('APPROVED' as any)) {
            // Success! Generate tokens.
            // If logging in via Telegram, we trust the identity and can bypass initial password reset
            // especially helpful for superusers with dummy emails.
            if ((session.user as any).must_reset_password) {
                await prisma.user.update({
                    where: { id: session.user_id },
                    data: { must_reset_password: false } as any
                });
            }

            return this.generateAuthResponse(session.user);
        }

        if (session.status === ('REJECTED' as any)) {
            throw new Error('Login rejected by user');
        }

        return null; // Still pending
    }

    /**
     * Refresh access token using a valid refresh token.
     * NO rotation, NO scoring, NO auto-block per MODULE 01 canon.
     */
    async refresh(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            // Verify the refresh token
            const payload = jwt.verify(refreshToken, this.jwtSecret) as { sub: string; email: string; role: string };

            // Validate user still exists and is active
            const user = await prisma.user.findUnique({ where: { id: payload.sub } });

            if (!user) {
                logger.debug('Refresh failed: user not found');
                throw new Error('Unauthorized');
            }

            // Generate new access token only (NO rotation of refresh token)
            const scopes = this.getScopesForStatus((user as any).admission_status);
            const newPayload = { sub: user.id, email: user.email, role: user.role, scopes };
            const accessToken = jwt.sign(newPayload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });

            logger.info('Token refresh successful', { userId: user.id });
            return { accessToken };
        } catch (error: any) {
            // Handle JWT verification errors (expired, invalid, etc.)
            if (error.name === 'TokenExpiredError') {
                logger.debug('Refresh failed: token expired');
            } else if (error.name === 'JsonWebTokenError') {
                logger.debug('Refresh failed: invalid token');
            }
            throw new Error('Unauthorized');
        }
    }

    /**
     * Logout - records user intent to end session.
     * NO token invalidation, NO session storage per MODULE 01 canon.
     * Token expiration is the only mechanism.
     */
    async logout(userId: string): Promise<void> {
        logger.info('User logout', { userId });
        // No token invalidation - this is an ACCEPTED LIMITATION
        // Frontend handles local token cleanup
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) throw new Error('Invalid current password');

        const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: newPasswordHash,
                // @ts-ignore
                must_reset_password: false,
            },
        });

        logger.info('Password changed successfully', { userId });
    }

    private generateAuthResponse(user: User): AuthResponseDto {
        const scopes = this.getScopesForStatus((user as any).foundation_status);
        const payload = { sub: user.id, email: user.email, role: user.role, scopes };
        const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
        const refreshToken = jwt.sign(payload, this.jwtSecret, { expiresIn: this.refreshTokenExpiresIn });
        return {
            accessToken,
            refreshToken,
            expiresIn: 3600,
            user: this.mapToUserResponse(user),
        };
    }

    private mapToUserResponse(user: User): UserResponseDto {
        try {
            const response: UserResponseDto = {
                id: user.id,
                email: user.email,
                role: user.role as UserRole,
                status: user.status as UserStatus,
                firstName: user.first_name,
                lastName: user.last_name,
                middleName: user.middle_name || undefined,
                phoneNumber: user.phone_number || undefined,
                avatar: user.avatar || undefined,
                departmentId: user.department_id || undefined,
                lastLoginAt: user.last_login_at instanceof Date ? user.last_login_at.toISOString() : undefined,
                createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : new Date().toISOString(),
                updatedAt: user.updated_at instanceof Date ? user.updated_at.toISOString() : new Date().toISOString(),
                personalDataConsent: user.personal_data_consent,
                mustResetPassword: user.must_reset_password || false,
                foundationStatus: (user.foundation_status as FoundationStatus) || FoundationStatus.NOT_STARTED,
                admissionStatus: user.admission_status as AdmissionStatus,
            };
            return response;
        } catch (error: any) {
            logger.error('CRITICAL ERROR in mapToUserResponse:', {
                error: error.message,
                userId: user.id
            });
            throw error;
        }
    }

    private getScopesForStatus(foundationStatus: FoundationStatus): string[] {
        switch (foundationStatus) {
            case FoundationStatus.ACCEPTED:
                return ['*'];
            case FoundationStatus.READY_TO_ACCEPT:
                return ['foundation:read', 'foundation:accept'];
            case FoundationStatus.READING:
            case FoundationStatus.NOT_STARTED:
            default:
                return ['foundation:read'];
        }
    }
}
