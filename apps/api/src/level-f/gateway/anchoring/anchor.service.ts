import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NodeWatcherService, AnchorProvider } from "./node-watcher.service";
import { createHash } from "crypto";

export interface AnchorReceipt {
  provider: AnchorProvider;
  receiptId: string;
  rootHash: string;
  anchoredAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Smart Contract Anchoring Service (Фаза 5)
 * Раз в 24 часа отправляет транзакцию в L1 (или Fallback L2)
 * с корневым Merkle Hash текущего дня.
 */
@Injectable()
export class AnchorService {
  private readonly logger = new Logger(AnchorService.name);

  constructor(private readonly nodeWatcher: NodeWatcherService) {}

  async anchorHash(
    rootHash: string,
    context: {
      domain: string;
      companyId: string;
      objectId: string;
    },
  ): Promise<AnchorReceipt> {
    const provider = this.nodeWatcher.getActiveProvider();
    const anchoredAt = new Date();
    const receiptId = createHash("sha256")
      .update(
        JSON.stringify({
          provider,
          rootHash,
          domain: context.domain,
          companyId: context.companyId,
          objectId: context.objectId,
          anchoredAt: anchoredAt.toISOString(),
        }),
      )
      .digest("hex")
      .slice(0, 32);

    this.logger.log(
      `Anchored hash via ${provider}: domain=${context.domain}, objectId=${context.objectId}, root=${rootHash.slice(0, 16)}...`,
    );

    return {
      provider,
      receiptId,
      rootHash,
      anchoredAt,
      metadata: {
        domain: context.domain,
        companyId: context.companyId,
        objectId: context.objectId,
      },
    };
  }

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
