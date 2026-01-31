"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardService = exports.RewardService = exports.RewardStatus = void 0;
const prisma_1 = require("../config/prisma");
const canon_1 = require("../core/flow/canon");
var RewardStatus;
(function (RewardStatus) {
    RewardStatus["PENDING"] = "PENDING";
    RewardStatus["APPROVED"] = "APPROVED";
    RewardStatus["REJECTED"] = "REJECTED";
    RewardStatus["PROCESSED"] = "PROCESSED";
})(RewardStatus || (exports.RewardStatus = RewardStatus = {}));
class RewardService {
    /**
     * Register a potential reward for an event (e.g. course completion)
     * Does NOT award MC immediately.
     */
    async registerEligibility(userId, eventType, eventRefId, amount) {
        return await prisma_1.prisma.rewardEligibility.create({
            data: {
                user_id: userId,
                event_type: eventType,
                event_ref_id: eventRefId,
                mc_amount: amount,
                status: RewardStatus.PENDING
            }
        });
    }
    /**
     * Process pending rewards for a user (can be called by cron or worker)
     */
    async processUserRewards(userId) {
        const pending = await prisma_1.prisma.rewardEligibility.findMany({
            where: {
                user_id: userId,
                status: RewardStatus.PENDING
            },
            orderBy: { created_at: 'asc' }
        });
        if (pending.length === 0)
            return { processed: 0 };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Calculate daily already processed MC
        const processedToday = await prisma_1.prisma.rewardEligibility.aggregate({
            where: {
                user_id: userId,
                status: RewardStatus.PROCESSED,
                processed_at: { gte: today }
            },
            _sum: { mc_amount: true }
        });
        let currentDailyTotal = processedToday._sum.mc_amount || 0;
        const DAILY_SOFT_CAP = 500;
        let processedCount = 0;
        for (const eligibility of pending) {
            let auditFlag = null;
            // Soft Cap Logic
            if (currentDailyTotal + eligibility.mc_amount > DAILY_SOFT_CAP) {
                auditFlag = 'REWARD_LIMIT_REACHED';
            }
            try {
                // Canonical Check
                await (0, canon_1.checkCanon)({
                    canon: 'MC',
                    action: 'MC_EARN',
                    source: 'API',
                    payload: {
                        userId,
                        amount: eligibility.mc_amount,
                        eventType: eligibility.event_type,
                        eventRefId: eligibility.event_ref_id,
                        monetaryEquivalent: false, // Critical: Not money
                        kpiBased: false, // Critical: Not KPI
                        creativeTask: false,
                        noExpiration: false,
                        unlimited: false
                    },
                    userId
                });
                // Transactional update for Wallet & Eligibility
                await prisma_1.prisma.$transaction(async (tx) => {
                    // 1. Update Wallet
                    await tx.wallet.update({
                        where: { user_id: userId },
                        data: {
                            mc_balance: { increment: eligibility.mc_amount }
                        }
                    });
                    // 2. Create Transaction Log
                    await tx.transaction.create({
                        data: {
                            type: 'EARN',
                            currency: 'MC',
                            amount: eligibility.mc_amount,
                            recipient_id: userId,
                            description: `Reward processed: ${eligibility.event_type}`,
                            metadata: {
                                eligibilityId: eligibility.id,
                                refId: eligibility.event_ref_id,
                                auditFlag
                            }
                        }
                    });
                    // 3. Update Eligibility status
                    await tx.rewardEligibility.update({
                        where: { id: eligibility.id },
                        data: {
                            status: RewardStatus.PROCESSED,
                            processed_at: new Date(),
                            audit_flag: auditFlag
                        }
                    });
                });
                currentDailyTotal += eligibility.mc_amount;
                processedCount++;
            }
            catch (error) {
                if (error.code === 'CANONICAL_VIOLATION') {
                    // Record violation or reject
                    await prisma_1.prisma.rewardEligibility.update({
                        where: { id: eligibility.id },
                        data: {
                            status: RewardStatus.REJECTED,
                            audit_flag: 'CANON_VIOLATION'
                        }
                    });
                }
                else {
                    console.error(`Failed to process reward ${eligibility.id}:`, error);
                    // Leave PENDING for retry if it's transient, or flag as ERROR
                }
            }
        }
        return { processed: processedCount, totalProcessedMC: currentDailyTotal };
    }
}
exports.RewardService = RewardService;
exports.rewardService = new RewardService();
