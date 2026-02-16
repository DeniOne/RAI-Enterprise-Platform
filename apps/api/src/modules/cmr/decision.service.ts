import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConfidenceLevel } from '@rai/prisma-client';

/**
 * DecisionService — Append-only audit layer.
 * Адаптирован под модель CmrDecision (Decision-ID: CONSULTING-VSLICE-001).
 * Решения IMMUTABLE: обновление и удаление запрещены.
 */
@Injectable()
export class DecisionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Создаёт иммутабельную запись решения.
     * Каждый FSM-переход в Consulting домене ОБЯЗАН вызывать этот метод.
     */
    async logDecision(data: {
        action: string;
        reason: string;
        actor: string;
        seasonId: string;
        companyId: string;
        userId?: string;
        confidenceLevel?: ConfidenceLevel;
        alternatives?: any;
    }) {
        return this.prisma.cmrDecision.create({
            data: {
                action: data.action,
                reason: data.reason,
                actor: data.actor,
                seasonId: data.seasonId,
                companyId: data.companyId,
                userId: data.userId,
                confidenceLevel: data.confidenceLevel ?? ConfidenceLevel.HIGH,
                alternatives: data.alternatives,
            },
        });
    }

    /**
     * Получить все решения для компании (read-only аудит).
     */
    async findAll(companyId: string, pagination?: { skip: number; limit: number; page: number }) {
        const take = pagination?.limit || 50;
        const skip = pagination?.skip || 0;
        const where = { companyId };

        const [data, total] = await Promise.all([
            this.prisma.cmrDecision.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.cmrDecision.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page: pagination?.page || 1,
                limit: take,
                totalPages: Math.ceil(total / take),
            }
        };
    }

    /**
     * Получить решения по сезону (read-only аудит).
     */
    async findBySeason(seasonId: string, companyId: string, pagination?: { skip: number; limit: number; page: number }) {
        const take = pagination?.limit || 50;
        const skip = pagination?.skip || 0;
        const where = { seasonId, companyId };

        const [data, total] = await Promise.all([
            this.prisma.cmrDecision.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            this.prisma.cmrDecision.count({ where })
        ]);

        return {
            data,
            meta: {
                total,
                page: pagination?.page || 1,
                limit: take,
                totalPages: Math.ceil(total / take),
            }
        };
    }

    // Иммутабельность: обновление и удаление запрещены (Legal Canon)
    async update() {
        throw new ForbiddenException('Legal Canon Violation: Записи решений иммутабельны.');
    }

    async delete() {
        throw new ForbiddenException('Legal Canon Violation: Записи решений не могут быть удалены.');
    }
}
