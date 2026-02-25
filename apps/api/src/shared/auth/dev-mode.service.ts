import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

/**
 * DevModeService — Single Responsibility: знает, включён ли dev-режим,
 * и отдаёт заглушку пользователя когда AUTH_DISABLED=true.
 *
 * В prod: AUTH_DISABLED не установлен / = false  → сервис не используется.
 * В dev:  AUTH_DISABLED=true → все guards пропускают запрос и подставляют devUser.
 */
@Injectable()
export class DevModeService {
    private _cachedCompanyId: string | null = null;

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    /** true если AUTH_DISABLED=true в .env */
    isDevMode(): boolean {
        return this.config.get<string>('AUTH_DISABLED') === 'true';
    }

    /** Возвращает companyId первой компании из БД (кэшируется в памяти) */
    async getDevCompanyId(): Promise<string> {
        if (this._cachedCompanyId) return this._cachedCompanyId;

        const company = await this.prisma.company.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });

        if (!company) {
            throw new Error('[DevModeService] No company found in DB. Run seed first.');
        }

        this._cachedCompanyId = company.id;
        return company.id;
    }

    /** Возвращает объект dev-пользователя совместимый с JwtStrategy.validate() */
    async getDevUser(): Promise<{ userId: string; email: string; companyId: string }> {
        const companyId = await this.getDevCompanyId();
        return {
            userId: 'dev-user-00000000',
            email: 'dev@local.rai',
            companyId,
        };
    }
}
