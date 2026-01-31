"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationService = exports.FoundationService = void 0;
const prisma_1 = require("@/config/prisma");
const foundation_constants_1 = require("@/config/foundation.constants");
const client_1 = require("@prisma/client");
const logger_1 = require("@/config/logger");
const event_emitter_1 = require("@nestjs/event-emitter");
class FoundationService {
    static instance;
    eventEmitter;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter || new event_emitter_1.EventEmitter2();
    }
    static getInstance() {
        if (!FoundationService.instance) {
            FoundationService.instance = new FoundationService();
        }
        return FoundationService.instance;
    }
    /**
     * Get all Active Foundation Blocks from DB
     */
    async getBlocks() {
        return await prisma_1.prisma.foundationBlock.findMany({
            where: { is_active: true },
            orderBy: { order: 'asc' },
            include: { material: true }
        });
    }
    /**
     * Get user's Foundation State
     */
    async getImmersionState(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                foundation_status: true,
                foundation_progress: true,
                foundation_version: true,
                foundation_current_block_id: true,
                accepted_version: true,
                base_accepted_at: true
            }
        });
        if (!user)
            throw new Error('User not found');
        // 1. Check Version Equality
        const isVersionMatch = user.foundation_version === foundation_constants_1.FOUNDATION_VERSION;
        if (user.foundation_status !== foundation_constants_1.FoundationStatus.ACCEPTED && !isVersionMatch && user.foundation_version !== null) {
            return await this.resetUserProgress(userId, 'Версия Базы обновлена. Пожалуйста, начните ознакомление заново.');
        }
        // 2. Fetch Active Blocks
        const dbBlocks = await this.getBlocks();
        // 3. Map Blocks
        const blocks = dbBlocks.map((dbBlock, index) => {
            const isCompleted = user.foundation_progress > index;
            const isUnlocked = index === 0 || user.foundation_progress >= index;
            return this.mapBlock(dbBlock, isCompleted, isUnlocked);
        });
        return {
            status: user.foundation_status,
            currentVersion: foundation_constants_1.FOUNDATION_VERSION,
            blocks,
            canAccept: user.foundation_status === foundation_constants_1.FoundationStatus.READY_TO_ACCEPT,
            acceptedAt: user.base_accepted_at ? user.base_accepted_at.toISOString() : undefined,
            currentBlockId: user.foundation_current_block_id,
            progress: user.foundation_progress
        };
    }
    /**
     * Reset user progress due to version change or other critical reasons
     */
    async resetUserProgress(userId, reason) {
        logger_1.logger.info(`Resetting foundation progress for user ${userId}. Reason: ${reason}`);
        const updatedUser = await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                foundation_status: foundation_constants_1.FoundationStatus.NOT_STARTED,
                foundation_progress: 0,
                foundation_current_block_id: null,
                foundation_version: foundation_constants_1.FOUNDATION_VERSION
            }
        });
        const blocks = await this.getBlocks();
        return {
            status: foundation_constants_1.FoundationStatus.NOT_STARTED,
            currentVersion: foundation_constants_1.FOUNDATION_VERSION,
            blocks: blocks.map((b, i) => this.mapBlock(b, false, i === 0)),
            canAccept: false,
            message: reason,
            progress: 0
        };
    }
    /**
     * Helper to map DB block to response format
     */
    mapBlock(dbBlock, isCompleted, isUnlocked) {
        const material = dbBlock.material;
        return {
            id: dbBlock.id,
            materialId: dbBlock.material_id,
            title: dbBlock.title,
            description: dbBlock.description,
            order: dbBlock.order,
            mandatory: dbBlock.mandatory,
            contentText: material?.content_text || '',
            videoUrl: material?.content_url || undefined,
            isVideoRequired: material?.is_video_required || false,
            isCompleted,
            isUnlocked
        };
    }
    /**
     * Centralized logic to evaluate and update foundation status based on progress
     */
    async evaluateFoundationProgress(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_status: true, foundation_progress: true }
        });
        if (!user)
            throw new Error('User not found');
        if (user.foundation_status === foundation_constants_1.FoundationStatus.ACCEPTED)
            return user.foundation_status;
        const activeBlocks = await prisma_1.prisma.foundationBlock.findMany({
            where: { is_active: true }
        });
        const totalBlocks = activeBlocks.length;
        let newStatus = user.foundation_status;
        if (user.foundation_progress >= totalBlocks && totalBlocks > 0) {
            newStatus = foundation_constants_1.FoundationStatus.READY_TO_ACCEPT;
        }
        else if (user.foundation_progress > 0) {
            newStatus = foundation_constants_1.FoundationStatus.READING;
        }
        if (newStatus !== user.foundation_status) {
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: { foundation_status: newStatus }
            });
        }
        return newStatus;
    }
    /**
     * Register that a user has viewed (clicked "Next") a block
     */
    async registerBlockView(userId, blockId, source = 'API') {
        const dbBlocks = await this.getBlocks();
        const blockIndex = dbBlocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) {
            throw new Error('Invalid or Inactive Foundation Block ID');
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_progress: true, foundation_status: true, foundation_version: true }
        });
        if (!user)
            throw new Error('User not found');
        // Version check before registering
        if (user.foundation_version !== foundation_constants_1.FOUNDATION_VERSION && user.foundation_status !== foundation_constants_1.FoundationStatus.ACCEPTED) {
            await this.resetUserProgress(userId, 'Версия Базы обновлена.');
            throw new Error('VERSION_MISMATCH: База была обновлена. Процесс сброшен.');
        }
        // Sequential Check: Increment progress if completing the current expected block
        const currentProgress = user.foundation_progress || 0;
        let newProgress = currentProgress;
        if (blockIndex === currentProgress) {
            newProgress = currentProgress + 1;
        }
        // Audit Log
        await prisma_1.prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: 'FOUNDATION_BLOCK_VIEWED',
                foundation_version: foundation_constants_1.FOUNDATION_VERSION,
                metadata: {
                    blockId,
                    blockOrder: blockIndex + 1,
                    source,
                    action: 'EXPLICIT_NEXT_CLICK'
                }
            }
        });
        // Update User
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: {
                foundation_progress: newProgress,
                foundation_current_block_id: blockId,
                foundation_version: foundation_constants_1.FOUNDATION_VERSION
            }
        });
        // Trigger Evaluation
        const finalStatus = await this.evaluateFoundationProgress(userId);
        return { success: true, currentProgress: newProgress, status: finalStatus };
    }
    /**
     * Submit decision on 'Base' (Foundation)
     */
    async submitDecision(userId, decision, source = 'API') {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_progress: true, foundation_status: true, foundation_version: true }
        });
        if (!user)
            throw new Error('User not found');
        if (decision === 'ACCEPT') {
            const activeBlocks = await this.getBlocks();
            const totalBlocks = activeBlocks.length;
            // Final Guard: Check version and progress
            if (user.foundation_version !== foundation_constants_1.FOUNDATION_VERSION) {
                await this.resetUserProgress(userId, 'Версия Базы обновлена.');
                throw new Error('База была обновлена. Необходимо пройти ознакомление заново.');
            }
            if (user.foundation_progress < totalBlocks) {
                throw new Error('Необходимо ознакомиться со всеми блоками Базы перед принятием.');
            }
            // Acceptance Transaction
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.foundationAcceptance.upsert({
                    where: { person_id: userId },
                    create: {
                        person_id: userId,
                        decision: client_1.FoundationDecision.ACCEPTED,
                        version: foundation_constants_1.FOUNDATION_VERSION,
                        accepted_at: new Date()
                    },
                    update: {
                        decision: client_1.FoundationDecision.ACCEPTED,
                        version: foundation_constants_1.FOUNDATION_VERSION,
                        accepted_at: new Date()
                    }
                }),
                prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        foundation_status: foundation_constants_1.FoundationStatus.ACCEPTED,
                        base_accepted_at: new Date(),
                        accepted_version: foundation_constants_1.FOUNDATION_VERSION,
                        base_version: foundation_constants_1.FOUNDATION_VERSION // Legacy support
                    }
                }),
                prisma_1.prisma.foundationAuditLog.create({
                    data: {
                        user_id: userId,
                        event_type: 'FOUNDATION_ACCEPTED',
                        foundation_version: foundation_constants_1.FOUNDATION_VERSION,
                        metadata: { source, action: 'FINAL_ACCEPTANCE' }
                    }
                })
            ]);
            this.eventEmitter.emit('foundation.accepted', {
                userId,
                version: foundation_constants_1.FOUNDATION_VERSION,
                timestamp: new Date()
            });
            return { success: true, status: foundation_constants_1.FoundationStatus.ACCEPTED };
        }
        else {
            await prisma_1.prisma.foundationAuditLog.create({
                data: {
                    user_id: userId,
                    event_type: 'FOUNDATION_DECLINED',
                    foundation_version: foundation_constants_1.FOUNDATION_VERSION,
                    metadata: { source }
                }
            });
            return { success: true, status: user.foundation_status };
        }
    }
    async assertFoundationAccessForApplied(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_status: true, accepted_version: true }
        });
        if (!user || user.foundation_status !== foundation_constants_1.FoundationStatus.ACCEPTED) {
            throw new Error('FOUNDATION_REQUIRED: Доступ ограничен. Необходимо принять Базу.');
        }
        if (user.accepted_version !== foundation_constants_1.FOUNDATION_VERSION) {
            throw new Error('FOUNDATION_VERSION_OUTDATED: Ваша версия Базы устарела. Требуется повторное ознакомление.');
        }
    }
}
exports.FoundationService = FoundationService;
exports.foundationService = FoundationService.getInstance();
