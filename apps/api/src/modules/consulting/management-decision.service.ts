import { Injectable, Logger, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
import { createHash } from 'crypto';
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DecisionStatus, UserRole } from "@rai/prisma-client";

export interface UserContext {
    userId: string;
    role: UserRole;
    companyId: string;
}

@Injectable()
export class ManagementDecisionService {
    private readonly logger = new Logger(ManagementDecisionService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Создает черновик решения. isActive = null для черновиков, чтобы не блокировать уникальность.
     */
    async createDraft(deviationId: string, description: string, expectedEffect: string, context: UserContext) {
        const deviation = await this.prisma.deviationReview.findUnique({
            where: { id: deviationId },
        });

        if (!deviation || deviation.companyId !== context.companyId) {
            throw new NotFoundException('Отклонение не найдено');
        }

        return this.prisma.managementDecision.create({
            data: {
                deviationId,
                description,
                expectedEffect,
                status: DecisionStatus.DRAFT,
                version: 1,
                authorId: context.userId,
                isActive: null, // Drafts are not active until confirmed
            }
        });
    }

    /**
     * Подтверждает решение. Реализовано как атомарная смена активной версии.
     * Генерирует хеш для обеспечения tamper-evidence.
     */
    async confirm(decisionId: string, context: UserContext) {
        const decision = await this.prisma.managementDecision.findUnique({
            where: { id: decisionId },
            include: { deviation: true }
        });

        if (!decision || decision.deviation.companyId !== context.companyId) {
            throw new NotFoundException('Решение не найдено');
        }

        if (decision.status !== DecisionStatus.DRAFT) {
            throw new ForbiddenException('Подтвердить можно только черновик');
        }

        //payload для хеширования (Tamper Detection)
        const payload = {
            id: decision.id,
            deviationId: decision.deviationId,
            version: decision.version, // Phase 3 Hardening
            description: decision.description,
            expectedEffect: decision.expectedEffect,
            authorId: decision.authorId,
            timestamp: new Date().toISOString()
        };
        const decisionHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');

        return this.prisma.$transaction(async (tx) => {
            // 1. Деактивируем все предыдущие подтвержденные решения для этого отклонения (Defense in Depth)
            await tx.managementDecision.updateMany({
                where: { deviationId: decision.deviationId, isActive: true },
                data: { isActive: null }
            });

            // 2. Подтверждаем текущее
            const confirmed = await tx.managementDecision.update({
                where: { id: decisionId },
                data: {
                    status: DecisionStatus.CONFIRMED,
                    confirmedAt: new Date(),
                    isActive: true,
                    decisionHash
                }
            });

            this.logger.log(`[MANAGEMENT] Decision ${decisionId} CONFIRMED. Hash: ${decisionHash.substring(0, 8)}`);
            return confirmed;
        });
    }

    /**
     * Заменяет решение. Старое решение de-facto становится историческим (isActive=null).
     */
    async supersede(oldDecisionId: string, newDescription: string, newExpectedEffect: string, context: UserContext) {
        const oldDecision = await this.prisma.managementDecision.findUnique({
            where: { id: oldDecisionId },
            include: { deviation: true }
        });

        if (!oldDecision || oldDecision.deviation.companyId !== context.companyId) {
            throw new NotFoundException('Исходное решение не найдено');
        }

        if (oldDecision.status !== DecisionStatus.CONFIRMED) {
            throw new ForbiddenException('Заменить можно только подтвержденное решение');
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Снимаем флаг активности со старого решения
            await tx.managementDecision.update({
                where: { id: oldDecisionId },
                data: {
                    status: DecisionStatus.SUPERSEDED,
                    isActive: null
                }
            });

            // 2. Создаем черновик новой версии
            return tx.managementDecision.create({
                data: {
                    deviationId: oldDecision.deviationId,
                    version: oldDecision.version + 1,
                    supersedesId: oldDecisionId,
                    description: newDescription,
                    expectedEffect: newExpectedEffect,
                    status: DecisionStatus.DRAFT,
                    authorId: context.userId,
                    isActive: null,
                }
            });
        });
    }

    async getDecisionHistory(decisionId: string, context: UserContext) {
        const decision = await this.prisma.managementDecision.findUnique({
            where: { id: decisionId },
            include: { deviation: true }
        });

        if (!decision || decision.deviation.companyId !== context.companyId) {
            throw new NotFoundException('Решение не найдено');
        }

        return this.prisma.managementDecision.findMany({
            where: { deviationId: decision.deviationId },
            orderBy: { version: 'desc' },
            include: { author: { select: { name: true, email: true } } }
        });
    }
}
