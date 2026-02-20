import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export enum AnchorProvider {
    PRIMARY_L1_EVM = 'PRIMARY_L1_EVM',             // Sepolia / Polygon
    SECONDARY_CONSORTIUM = 'SECONDARY_CONSORTIUM'   // Fabric / Quorum
}

/**
 * Node-Watcher Service (Фаза 5)
 * Следит за доступностью RPC нод. Если Primary Layer 1 отваливается на >24 часа,
 * автоматически переключает публикации хешей на Secondary Consortium Ledger.
 */
@Injectable()
export class NodeWatcherService {
    private readonly logger = new Logger(NodeWatcherService.name);
    private activeProvider: AnchorProvider = AnchorProvider.PRIMARY_L1_EVM;
    private primaryDowntimeStart: number | null = null;

    // 24 hours in milliseconds
    private readonly DOWNTIME_THRESHOLD_MS: number = 24 * 60 * 60 * 1000;

    /**
     * Провеняем состояние связи с L1 каждые 5 минут
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async checkNodeHealth() {
        const isPrimaryHealthy = await this.pingPrimaryRpc();

        if (!isPrimaryHealthy) {
            if (!this.primaryDowntimeStart) {
                this.primaryDowntimeStart = Date.now();
                this.logger.warn(`Primary L1 RPC is down. Tracking downtime...`);
            } else {
                const downtime = Date.now() - this.primaryDowntimeStart;
                if (downtime > this.DOWNTIME_THRESHOLD_MS && this.activeProvider === AnchorProvider.PRIMARY_L1_EVM) {
                    this.logger.error(`Primary L1 RPC downtime exceeded 24h. Triggering FALLBACK to Secondary Ledger.`);
                    this.activeProvider = AnchorProvider.SECONDARY_CONSORTIUM;
                }
            }
        } else {
            if (this.primaryDowntimeStart) {
                const downtimeSeconds = Math.round((Date.now() - this.primaryDowntimeStart) / 1000);
                this.logger.log(`Primary L1 RPC recovered after ${downtimeSeconds}s.`);
                this.primaryDowntimeStart = null;

                // Если мы были на Fallback, возвращаемся на Primary
                if (this.activeProvider === AnchorProvider.SECONDARY_CONSORTIUM) {
                    this.logger.log(`Switching back to Primary L1 EVM.`);
                    this.activeProvider = AnchorProvider.PRIMARY_L1_EVM;
                }
            }
        }
    }

    public getActiveProvider(): AnchorProvider {
        return this.activeProvider;
    }

    private async pingPrimaryRpc(): Promise<boolean> {
        // Заглушка: проверка HTTP POST к RPC ноде
        // Для симуляции Фазы 6 вернем true
        return true;
    }
}
