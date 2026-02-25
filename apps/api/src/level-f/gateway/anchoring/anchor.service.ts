import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NodeWatcherService, AnchorProvider } from "./node-watcher.service";

/**
 * Smart Contract Anchoring Service (Фаза 5)
 * Раз в 24 часа отправляет транзакцию в L1 (или Fallback L2)
 * с корневым Merkle Hash текущего дня.
 */
@Injectable()
export class AnchorService {
  private readonly logger = new Logger(AnchorService.name);

  constructor(private readonly nodeWatcher: NodeWatcherService) {}

  // Эмуляция публикации раз в 24 часа
  // В реальности: CronExpression.EVERY_DAY_AT_MIDNIGHT
  // Для демо/тестов Фазы 6 поставим 12 часов
  @Cron(CronExpression.EVERY_12_HOURS)
  async publishDailyRootHash() {
    const activeProvider = this.nodeWatcher.getActiveProvider();
    this.logger.log(
      `Starting daily Anchoring process... Active Provider: ${activeProvider}`,
    );

    // Заглушка получения свежего HeadHash из SnapshotService
    const mockMerkleRootHash =
      "0x" +
      Buffer.from(Date.now().toString())
        .toString("hex")
        .padEnd(64, "0")
        .slice(0, 64);

    try {
      if (activeProvider === AnchorProvider.PRIMARY_L1_EVM) {
        // Ethers.js: Сборка транзакции `SnapshotAnchor.anchorSnapshot(bytes32)`
        // await contract.anchorSnapshot(mockMerkleRootHash);
        this.logger.log(
          `[EVM L1] Successfully anchored daily root: ${mockMerkleRootHash}`,
        );
      } else {
        // Secondary Hyperledger/Consortium API:
        // await fabricService.invokeTransaction('anchorSnapshot', mockMerkleRootHash)
        this.logger.log(
          `[Consortium L2] Successfully anchored fallback daily root: ${mockMerkleRootHash}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to anchor snapshot root`, error);
    }
  }
}
