/**
 * Economy Analytics Service
 * PHASE 4 — Analytics, Observability & Governance
 * Refactored to Express (no NestJS)
 */

import { prisma } from '../../config/prisma';
import {
    EconomyOverviewDto,
    StoreActivityDto,
    WalletTrendPointDto,
    AuditLogEntryDto
} from '../dto/analytics.dto';

export class EconomyAnalyticsService {

    /**
     * Глобальная аналитика системы (Overview)
     */
    async getGlobalOverview(): Promise<EconomyOverviewDto> {
        // @ts-ignore
        const issued = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                currency: 'MC',
                type: { in: ['EARN', 'REWARD'] }
            }
        });

        // @ts-ignore
        const spent = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                currency: 'MC',
                type: { in: ['SPEND', 'STORE_PURCHASE'] }
            }
        });

        // @ts-ignore
        const burned = await prisma.transaction.aggregate({
            _sum: { amount: true },
            where: {
                currency: 'MC',
                type: 'PENALTY'
            }
        });

        const activeWallets = await prisma.wallet.count({
            where: { mc_balance: { gt: 0 } }
        });

        return {
            totalIssuedMC: Number(issued._sum.amount || 0),
            totalSpentMC: Number(spent._sum.amount || 0),
            totalBurnedMC: Number(burned._sum.amount || 0),
            activeWalletsCount: activeWallets,
            timestamp: new Date()
        };
    }

    /**
     * Аналитика магазина (Top Items)
     */
    async getStoreActivity(): Promise<StoreActivityDto[]> {
        // @ts-ignore
        const activities = await prisma.purchase.groupBy({
            by: ['itemId'],
            _count: { id: true },
            _sum: { priceMC: true },
            orderBy: {
                _count: { id: 'desc' }
            }
        });

        // Map with item titles
        const result: StoreActivityDto[] = [];
        for (const act of activities) {
            const item = await prisma.storeItem.findUnique({
                where: { id: act.itemId },
                select: { title: true }
            });
            result.push({
                itemId: act.itemId,
                itemTitle: item?.title || 'Unknown Item',
                purchaseCount: act._count.id,
                totalVolumeMC: act._sum.priceMC || 0
            });
        }

        return result;
    }

    /**
     * Персональный тренд (Wallet Trend)
     */
    async getUserWalletTrend(userId: string): Promise<WalletTrendPointDto[]> {
        // В этой реализации мы просто берем последние снимки баланса (если они есть) 
        // или восстанавливаем тренд по истории транзакций.
        // Для MVP Phase 4 возьмем транзакции и построим кумулятивную сумму.

        // @ts-ignore
        const txs = await prisma.transaction.findMany({
            where: { recipient_id: userId, currency: 'MC' },
            orderBy: { created_at: 'asc' }
        });

        let currentBalance = 0;
        return txs.map(tx => {
            currentBalance += Number(tx.amount);
            return {
                timestamp: tx.created_at,
                mcBalance: currentBalance,
                gmcBalance: 0 // GMC тренд можно добавить позже
            };
        });
    }

    /**
     * Журнал аудита (Audit Trail)
     */
    async getAuditTrail(userId?: string): Promise<AuditLogEntryDto[]> {
        const where = userId ? { userId } : {};
        // @ts-ignore
        const purchases = await prisma.purchase.findMany({
            where,
            include: { item: { select: { title: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return purchases.map(p => ({
            id: p.id,
            timestamp: p.createdAt,
            action: `PURCHASE: ${p.item.title}`,
            details: { priceMC: p.priceMC, status: p.status },
            userId: p.userId
        }));
    }
}

export const economyAnalyticsService = new EconomyAnalyticsService();
