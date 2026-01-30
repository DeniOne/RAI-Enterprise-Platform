"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foundationService = exports.FoundationService = void 0;
const prisma_1 = require("../config/prisma");
const foundation_constants_1 = require("../config/foundation.constants");
const client_1 = require("@prisma/client");
class FoundationService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!FoundationService.instance) {
            FoundationService.instance = new FoundationService();
        }
        return FoundationService.instance;
    }
    /**
     * Get user's Immersion Progress and Acceptance Status
     */
    async getImmersionState(userId) {
        // 1. Check Acceptance
        const acceptance = await prisma_1.prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });
        const isAccepted = acceptance?.decision === client_1.FoundationDecision.ACCEPTED;
        const isVersionMatch = acceptance?.version === foundation_constants_1.FOUNDATION_VERSION;
        // 2. Fetch Materials for content
        const materialIds = foundation_constants_1.FOUNDATION_BLOCKS.map(b => b.materialId);
        const materials = await prisma_1.prisma.material.findMany({
            where: { id: { in: materialIds } },
            select: { id: true, content_text: true, content_url: true, is_video_required: true }
        });
        const materialMap = new Map(materials.map(m => [m.id, { text: m.content_text, url: m.content_url, required: m.is_video_required }]));
        // 3. Calculate Block Progress (from Audit Log)
        const blockLogs = await prisma_1.prisma.foundationAuditLog.findMany({
            where: {
                user_id: userId,
                event_type: 'BLOCK_VIEWED',
            },
            select: { metadata: true }
        });
        // Extract viewed block IDs
        const viewedBlockIds = new Set();
        blockLogs.forEach(log => {
            const meta = log.metadata;
            if (meta?.blockId && meta?.version === foundation_constants_1.FOUNDATION_VERSION) {
                viewedBlockIds.add(meta.blockId);
            }
        });
        const blocks = foundation_constants_1.FOUNDATION_BLOCKS.map(block => {
            const material = materialMap.get(block.materialId);
            // Critical Methodology Check: If video is required but content_url is missing
            const isMethodologyViolated = material?.required && !material?.url;
            return {
                ...block,
                contentText: material?.text || '',
                videoUrl: material?.url || undefined,
                isVideoRequired: material?.required || false,
                isMethodologyViolated
            };
        });
        // 4. Final state calculation
        let status = foundation_constants_1.FoundationStatus.NOT_STARTED;
        if (isAccepted) {
            status = isVersionMatch ? foundation_constants_1.FoundationStatus.ACCEPTED : foundation_constants_1.FoundationStatus.VERSION_MISMATCH;
        }
        else if (viewedBlockIds.size > 0) {
            status = foundation_constants_1.FoundationStatus.IN_PROGRESS;
        }
        // Sequential locking logic
        let previousCompleted = true;
        const blocksWithLocking = blocks.map((block, index) => {
            const isCompleted = viewedBlockIds.has(block.id);
            // Block is unlocked if previously completed OR if it's the 1st block OR if already accepted
            const isUnlocked = index === 0 || previousCompleted || isAccepted;
            if (!isCompleted)
                previousCompleted = false;
            return {
                ...block,
                isUnlocked,
                isCompleted
            };
        });
        return {
            status,
            currentVersion: foundation_constants_1.FOUNDATION_VERSION,
            blocks: blocksWithLocking,
            canAccept: viewedBlockIds.size === foundation_constants_1.FOUNDATION_BLOCKS.length,
            acceptedAt: acceptance?.accepted_at?.toISOString()
        };
    }
    /**
     * Register that a user has viewed a block
     */
    async registerBlockView(userId, blockId) {
        // Validate Block ID
        const isValidBlock = foundation_constants_1.FOUNDATION_BLOCKS.some(b => b.id === blockId);
        if (!isValidBlock) {
            throw new Error('Invalid Foundation Block ID');
        }
        // Idempotency: Check if already viewed to avoid spamming Audit Log?
        // Canon: Audit Log is append-only. Repetitive views are fine, but we can debounce if needed.
        // Strategies:
        // A) Log every view (Good for analytics: "read it 5 times")
        // B) Log unique only
        // Let's log unique per day or just log it. "BLOCK_VIEWED" implies an action.
        // Let's check if already viewed for this version to keep log clean (optional)
        const existing = await prisma_1.prisma.foundationAuditLog.findFirst({
            where: {
                user_id: userId,
                event_type: 'BLOCK_VIEWED',
                metadata: {
                    path: ['blockId'],
                    equals: blockId
                }
            }
        });
        // Actually, Prisma JSON filtering is tricky. Let's just create.
        await prisma_1.prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: 'BLOCK_VIEWED',
                timestamp: new Date(),
                metadata: {
                    blockId,
                    version: foundation_constants_1.FOUNDATION_VERSION,
                    userAgent: 'API' // Context could be passed
                }
            }
        });
        // Sync User status to IN_PROGRESS if not already
        // @ts-ignore
        await prisma_1.prisma.user.updateMany({
            where: {
                id: userId,
                // @ts-ignore
                foundation_status: 'NOT_STARTED'
            },
            // @ts-ignore
            data: { foundation_status: 'IN_PROGRESS' }
        });
        return { success: true };
    }
    /**
     * Assert user has accepted current Foundation version
     * Throws error if not accepted or version mismatch
     */
    async assertFoundationAccessForApplied(userId) {
        const acceptance = await prisma_1.prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });
        if (!acceptance || acceptance.decision !== client_1.FoundationDecision.ACCEPTED) {
            await this.logGatingViolation(userId, 'ACCESS_DENIED_NO_ACCEPTANCE');
            throw new Error('FOUNDATION_REQUIRED: You must accept the Foundation to access Applied content.');
        }
        if (acceptance.version !== foundation_constants_1.FOUNDATION_VERSION) {
            await this.logGatingViolation(userId, 'ACCESS_DENIED_VERSION_MISMATCH', {
                userVersion: acceptance.version,
                requiredVersion: foundation_constants_1.FOUNDATION_VERSION
            });
            throw new Error(`FOUNDATION_VERSION_OUTDATED: Your acceptance is for version ${acceptance.version}, but ${foundation_constants_1.FOUNDATION_VERSION} is required.`);
        }
    }
    /**
     * Internal audit logging for gating violations
     */
    async logGatingViolation(userId, reason, extraMetadata = {}) {
        await prisma_1.prisma.foundationAuditLog.create({
            data: {
                user_id: userId,
                event_type: 'BLOCKED_ACCESS',
                foundation_version: foundation_constants_1.FOUNDATION_VERSION,
                metadata: {
                    reason,
                    context: 'ENROLLMENT_GATE',
                    timestamp: new Date(),
                    ...extraMetadata
                }
            }
        });
    }
}
exports.FoundationService = FoundationService;
exports.foundationService = FoundationService.getInstance();
