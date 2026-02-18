import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserAccessLevel } from '@rai/prisma-client';
// Removed: InjectBot, Telegraf - bot is now a separate microservice
import { randomUUID } from 'crypto';

export interface TelegramLoginSession {
    sessionId: string;
    telegramId: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    expiresAt: string;
}

@Injectable()
export class TelegramAuthService {
    private readonly SESSION_TTL = 300; // 5 minutes

    constructor(
        private redis: RedisService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async initiateLogin(telegramId: string, companyId?: string): Promise<{ sessionId: string }> {
        console.log(`[TelegramAuthService] Initiating login for telegramId: "${telegramId}" (type: ${typeof telegramId})`);

        // Check if user exists
        const user = await this.prisma.user.findFirst({
            where: { telegramId: telegramId.trim(), ...(companyId ? { companyId } : {}) },
        });

        if (!user) {
            console.log(`[TelegramAuthService] User with telegramId "${telegramId}" not found in database`);
            throw new Error('User not found');
        }

        console.log(`[TelegramAuthService] User found: ${user.email} (ID: ${user.id})`);

        const sessionId = randomUUID();
        const session: TelegramLoginSession = {
            sessionId,
            telegramId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000).toISOString(),
        };

        await this.redis.set(
            `telegram-login:${sessionId}`,
            JSON.stringify(session),
            this.SESSION_TTL,
        );

        // Notify bot microservice to send Telegram push notification
        try {
            await fetch(`${process.env.BOT_URL || 'http://localhost:4002'}/internal/notify-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-API-Key': process.env.INTERNAL_API_KEY || '',
                },
                body: JSON.stringify({
                    telegramId,
                    sessionId,
                }),
            });
        } catch (error) {
            console.error('Failed to notify bot microservice:', error);
            // Don't throw - session is created, notification is best-effort
        }

        return { sessionId };
    }

    async confirmLogin(sessionId: string): Promise<{ accessToken: string }> {
        const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
        if (!sessionData) {
            throw new Error('Session not found or expired');
        }

        const session: TelegramLoginSession = JSON.parse(sessionData);

        // If already approved, just return the token
        if (session.status === 'approved') {
            return this.generateTokenForTelegramUser(session.telegramId);
        }

        if (session.status !== 'pending') {
            throw new Error(`Session already processed (status: ${session.status})`);
        }

        // Update session status to approved
        session.status = 'approved';
        await this.redis.set(
            `telegram-login:${sessionId}`,
            JSON.stringify(session),
            60, // Keep for 1 minute for polling to pick up
        );

        return this.generateTokenForTelegramUser(session.telegramId);
    }

    private async generateTokenForTelegramUser(telegramId: string): Promise<{ accessToken: string }> {
        const user = await this.prisma.user.findFirst({
            where: { telegramId: telegramId.trim() },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            companyId: user.companyId,
        };

        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }

    async denyLogin(sessionId: string): Promise<void> {
        const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
        if (!sessionData) {
            throw new Error('Session not found or expired');
        }

        const session: TelegramLoginSession = JSON.parse(sessionData);
        session.status = 'denied';

        await this.redis.set(
            `telegram-login:${sessionId}`,
            JSON.stringify(session),
            60, // Keep for 1 minute for polling to pick up
        );
    }

    async checkLoginStatus(sessionId: string): Promise<TelegramLoginSession> {
        const sessionData = await this.redis.get(`telegram-login:${sessionId}`);
        if (!sessionData) {
            throw new Error('Session not found or expired');
        }

        return JSON.parse(sessionData);
    }

    async getUserByTelegramId(telegramId: string, companyId?: string) {
        return this.prisma.user.findFirst({
            where: { telegramId: telegramId.trim(), ...(companyId ? { companyId } : {}) },
        });
    }

    async upsertUserFromTelegram(data: {
        telegramId: string;
        email: string;
        role: string;
        accessLevel: string;
        companyId: string;
    }) {
        return this.prisma.user.upsert({
            where: { telegramId: data.telegramId },
            update: {
                accessLevel: data.accessLevel as UserAccessLevel,
                company: { connect: { id: data.companyId } },
            },
            create: {
                telegramId: data.telegramId,
                email: data.email,
                role: data.role as UserRole,
                accessLevel: data.accessLevel as UserAccessLevel,
                // companyId: data.companyId, // Redundant with connect for standard CreateInput
                company: { connect: { id: data.companyId } },
                emailVerified: true,
            },
        });
    }

    async getFirstCompany() {
        return this.prisma.company.findFirst();
    }

    async getActiveUsers(companyId?: string) {
        return this.prisma.user.findMany({
            where: {
                ...(companyId ? { companyId } : {}),
                accessLevel: 'ACTIVE',
                telegramId: { not: null },
            },
            select: {
                telegramId: true,
                email: true,
            },
        });
    }
}
