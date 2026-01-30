import { prisma } from '../config/prisma';
import { FOUNDATION_VERSION, FoundationStatus } from '../config/foundation.constants';
import { FoundationDecision, AdmissionStatus } from '@prisma/client';
import { logger } from '../config/logger';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface FoundationBlock {
    id: string;
    materialId: string;
    title: string;
    description: string;
    order: number;
    mandatory: boolean;
    contentText: string;
    videoUrl?: string;
    isVideoRequired: boolean;
    isCompleted: boolean;
    isUnlocked: boolean;
}

export interface FoundationState {
    status: FoundationStatus;
    currentVersion: string;
    blocks: FoundationBlock[];
    canAccept: boolean;
    acceptedAt?: string;
    currentBlockId?: string | null;
    progress: number;
    message?: string;
}

export class FoundationService {
    private static instance: FoundationService;
    private eventEmitter: EventEmitter2;

    private constructor(eventEmitter?: EventEmitter2) {
        this.eventEmitter = eventEmitter || new EventEmitter2();
    }

    public static getInstance(): FoundationService {
        if (!FoundationService.instance) {
            FoundationService.instance = new FoundationService();
        }
        return FoundationService.instance;
    }

    /**
     * Get all Active Foundation Blocks from DB
     */
    async getBlocks() {
        return await prisma.foundationBlock.findMany({
            where: { is_active: true },
            orderBy: { order: 'asc' },
            include: { material: true }
        });
    }

    /**
     * Get user's Foundation State
     */
    async getImmersionState(userId: string): Promise<FoundationState> {
        const user = await prisma.user.findUnique({
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

        if (!user) throw new Error('User not found');

        // 1. Check Version Equality
        const isVersionMatch = user.foundation_version === FOUNDATION_VERSION;

        if (user.foundation_status !== FoundationStatus.ACCEPTED && !isVersionMatch && user.foundation_version !== null) {
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
            status: user.foundation_status as FoundationStatus,
            currentVersion: FOUNDATION_VERSION,
            blocks,
            canAccept: user.foundation_status === FoundationStatus.READY_TO_ACCEPT,
            acceptedAt: user.base_accepted_at ? user.base_accepted_at.toISOString() : undefined,
            currentBlockId: user.foundation_current_block_id,
            progress: user.foundation_progress
        };
    }

    /**
     * Reset user progress due to version change or other critical reasons
     */
    private async resetUserProgress(userId: string, reason: string): Promise<FoundationState> {
        logger.info(`Resetting foundation progress for user ${userId}. Reason: ${reason}`);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                foundation_status: FoundationStatus.NOT_STARTED,
                foundation_progress: 0,
                foundation_current_block_id: null,
                foundation_version: FOUNDATION_VERSION
            }
        });

        const blocks = await this.getBlocks();
        return {
            status: FoundationStatus.NOT_STARTED,
            currentVersion: FOUNDATION_VERSION,
            blocks: blocks.map((b, i) => this.mapBlock(b, false, i === 0)),
            canAccept: false,
            message: reason,
            progress: 0
        };
    }

    /**
     * Helper to map DB block to response format
     */
    private mapBlock(dbBlock: any, isCompleted: boolean, isUnlocked: boolean): FoundationBlock {
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
    async evaluateFoundationProgress(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_status: true, foundation_progress: true }
        });

        if (!user) throw new Error('User not found');
        if (user.foundation_status === FoundationStatus.ACCEPTED) return user.foundation_status;

        const activeBlocks = await prisma.foundationBlock.findMany({
            where: { is_active: true }
        });
        const totalBlocks = activeBlocks.length;

        let newStatus = user.foundation_status as FoundationStatus;

        if (user.foundation_progress >= totalBlocks && totalBlocks > 0) {
            newStatus = FoundationStatus.READY_TO_ACCEPT;
        } else if (user.foundation_progress > 0) {
            newStatus = FoundationStatus.READING;
        }

        if (newStatus !== user.foundation_status) {
            await prisma.user.update({
                where: { id: userId },
                data: { foundation_status: newStatus }
            });
        }

        return newStatus;
    }

    /**
     * Register that a user has viewed (clicked "Next") a block
     */
    async registerBlockView(userId: string, blockId: string, source: string = 'API') {
        const dbBlocks = await this.getBlocks();
        const blockIndex = dbBlocks.findIndex(b => b.id === blockId);

        if (blockIndex === -1) {
            throw new Error('Invalid or Inactive Foundation Block ID');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_progress: true, foundation_status: true, foundation_version: true }
        });

        if (!user) throw new Error('User not found');

        // Version check before registering
        if (user.foundation_version !== FOUNDATION_VERSION && user.foundation_status !== FoundationStatus.ACCEPTED) {
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
        await prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: 'FOUNDATION_BLOCK_VIEWED',
                foundation_version: FOUNDATION_VERSION,
                metadata: {
                    blockId,
                    blockOrder: blockIndex + 1,
                    source,
                    action: 'EXPLICIT_NEXT_CLICK'
                }
            }
        });

        // Update User
        await prisma.user.update({
            where: { id: userId },
            data: {
                foundation_progress: newProgress,
                foundation_current_block_id: blockId,
                foundation_version: FOUNDATION_VERSION
            }
        });

        // Trigger Evaluation
        const finalStatus = await this.evaluateFoundationProgress(userId);

        return { success: true, currentProgress: newProgress, status: finalStatus };
    }

    /**
     * Submit decision on 'Base' (Foundation)
     */
    async submitDecision(userId: string, decision: 'ACCEPT' | 'DECLINE', source: string = 'API') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_progress: true, foundation_status: true, foundation_version: true }
        });

        if (!user) throw new Error('User not found');

        if (decision === 'ACCEPT') {
            const activeBlocks = await this.getBlocks();
            const totalBlocks = activeBlocks.length;

            // Final Guard: Check version and progress
            if (user.foundation_version !== FOUNDATION_VERSION) {
                await this.resetUserProgress(userId, 'Версия Базы обновлена.');
                throw new Error('База была обновлена. Необходимо пройти ознакомление заново.');
            }

            if (user.foundation_progress < totalBlocks) {
                throw new Error('Необходимо ознакомиться со всеми блоками Базы перед принятием.');
            }

            // Acceptance Transaction
            await prisma.$transaction([
                prisma.foundationAcceptance.upsert({
                    where: { person_id: userId },
                    create: {
                        person_id: userId,
                        decision: FoundationDecision.ACCEPTED,
                        version: FOUNDATION_VERSION,
                        accepted_at: new Date()
                    },
                    update: {
                        decision: FoundationDecision.ACCEPTED,
                        version: FOUNDATION_VERSION,
                        accepted_at: new Date()
                    }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        foundation_status: FoundationStatus.ACCEPTED,
                        base_accepted_at: new Date(),
                        accepted_version: FOUNDATION_VERSION,
                        base_version: FOUNDATION_VERSION // Legacy support
                    }
                }),
                prisma.foundationAuditLog.create({
                    data: {
                        user_id: userId,
                        event_type: 'FOUNDATION_ACCEPTED',
                        foundation_version: FOUNDATION_VERSION,
                        metadata: { source, action: 'FINAL_ACCEPTANCE' }
                    }
                })
            ]);

            this.eventEmitter.emit('foundation.accepted', {
                userId,
                version: FOUNDATION_VERSION,
                timestamp: new Date()
            });

            return { success: true, status: FoundationStatus.ACCEPTED };
        } else {
            await prisma.foundationAuditLog.create({
                data: {
                    user_id: userId,
                    event_type: 'FOUNDATION_DECLINED',
                    foundation_version: FOUNDATION_VERSION,
                    metadata: { source }
                }
            });
            return { success: true, status: user.foundation_status };
        }
    }

    async assertFoundationAccessForApplied(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { foundation_status: true, accepted_version: true }
        });

        if (!user || user.foundation_status !== FoundationStatus.ACCEPTED) {
            throw new Error('FOUNDATION_REQUIRED: Доступ ограничен. Необходимо принять Базу.');
        }

        if (user.accepted_version !== FOUNDATION_VERSION) {
            throw new Error('FOUNDATION_VERSION_OUTDATED: Ваша версия Базы устарела. Требуется повторное ознакомление.');
        }
    }
}

export const foundationService = FoundationService.getInstance();
