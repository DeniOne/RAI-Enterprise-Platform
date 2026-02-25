import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  FieldObservation,
  AssetStatus,
  MachineryType,
  StockItemType,
} from "@rai/prisma-client";
import * as crypto from "crypto";
import { TelegramNotificationService } from "../telegram/telegram-notification.service";

// [CONTRACT] Интерфейс для отделения сенсоров (AI) от бизнес-логики
interface RegistryRecognitionResult {
  entityType: "MACHINERY" | "STOCK";
  confidence: number;
  extractedFields: Record<string, any>;
  rawEvidence: string[];
}

@Injectable()
export class RegistryAgentService {
  private readonly logger = new Logger(RegistryAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramNotificationService,
  ) {}

  /**
   * Обработка наблюдения для ИИ-распознавания активов.
   */
  async processObservation(observation: FieldObservation) {
    this.logger.log(
      `[REGISTRY-AGENT] Analyzing potential asset from observation ${observation.id}`,
    );

    // 1. Генерация ключа идемпотентности на основе контента
    const idempotencyKey = this.generateIdempotencyKey(observation);

    try {
      // 2. Идентификация сущности (Contract Based)
      const recognitionResult = await this.recognizeAsset(observation);

      if (!recognitionResult || recognitionResult.confidence < 0.7) {
        this.logger.log(
          `[REGISTRY-AGENT] No confident asset in observation ${observation.id} (Confidence: ${recognitionResult?.confidence})`,
        );
        return;
      }

      const { entityType, extractedFields } = recognitionResult;

      if (entityType === "MACHINERY") {
        await this.handleMachinery(
          extractedFields,
          observation,
          idempotencyKey,
        );
      } else if (entityType === "STOCK") {
        await this.handleStock(extractedFields, observation, idempotencyKey);
      }
    } catch (error) {
      this.logger.error(
        `[REGISTRY-AGENT] Error processing observation ${observation.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  private generateIdempotencyKey(observation: FieldObservation): string {
    const source =
      observation.photoUrl ||
      observation.voiceUrl ||
      observation.content ||
      observation.id;
    return crypto.createHash("sha256").update(source).digest("hex");
  }

  private async recognizeAsset(
    observation: FieldObservation,
  ): Promise<RegistryRecognitionResult | null> {
    // MOCK: Имитируем работу агента (Vision/LLM)
    if (observation.photoUrl?.includes("tractor")) {
      return {
        entityType: "MACHINERY",
        confidence: 0.95,
        extractedFields: {
          name: "John Deere 8R",
          brand: "John Deere",
          type: "TRACTOR",
          serialNumber: "SN-JD8R-MOCK",
        },
        rawEvidence: [observation.photoUrl],
      };
    }

    if (observation.photoUrl?.includes("chemical")) {
      return {
        entityType: "STOCK",
        confidence: 0.88,
        extractedFields: {
          name: "Амистар Экстра",
          type: "CHEMICAL",
          quantity: 100,
          unit: "л",
        },
        rawEvidence: [observation.photoUrl],
      };
    }

    return null; // Не распознано
  }

  private async handleMachinery(
    metadata: any,
    observation: FieldObservation,
    idempotencyKey: string,
  ) {
    // 1. Проверка идемпотентности (Logical Index Check)
    const existingByHash = await this.prisma.machinery.findFirst({
      where: {
        companyId: observation.companyId,
        idempotencyKey,
      },
    });

    // Repeat Guard: Strict Idempotency Policy
    if (existingByHash) {
      if (existingByHash.status === AssetStatus.REJECTED) {
        this.logger.warn(
          `[REGISTRY-AGENT] Machinery REJECTED by hash. Skipping.`,
        );
      } else {
        this.logger.log(
          `[REGISTRY-AGENT] Machinery idempotency hit (${existingByHash.status}). Skipping.`,
        );
      }
      return;
    }

    // Если уже есть в системе (даже с другим фото, но тот же серийник)
    const existingActive = await this.prisma.machinery.findFirst({
      where: {
        serialNumber: metadata.serialNumber, // Physical Identity
        companyId: observation.companyId,
        status: { not: AssetStatus.REJECTED }, // Игнорим отклоненные, даем шанс пересоздать
      },
    });

    if (existingActive) {
      this.logger.log(
        `[REGISTRY-AGENT] Asset already exists: ${existingActive.id}`,
      );
      return;
    }

    const accountId = await this.resolveAccountId(observation);

    // 2. Создание черновика
    const draft = await this.prisma.machinery.create({
      data: {
        name: metadata.name,
        brand: metadata.brand,
        type: metadata.type as MachineryType,
        serialNumber: metadata.serialNumber,
        status: AssetStatus.PENDING_CONFIRMATION,
        idempotencyKey,
        companyId: observation.companyId,
        accountId,
      },
    });

    this.logger.log(`[REGISTRY-AGENT] Created DRAFT Machinery: ${draft.id}`);

    // 3. Уведомление в Telegram (Updated to send account context if needed, but payload structure is generic)
    await this.telegram.sendAssetProposal(observation.authorId, {
      id: draft.id,
      type: "MACHINERY",
      ...metadata,
    });
  }

  private async handleStock(
    metadata: any,
    observation: FieldObservation,
    idempotencyKey: string,
  ) {
    // 1. Проверка идемпотентности (Logical Index Check)
    const existingByHash = await this.prisma.stockItem.findFirst({
      where: {
        companyId: observation.companyId,
        idempotencyKey,
      },
    });

    if (existingByHash) {
      if (existingByHash.status === AssetStatus.REJECTED) {
        this.logger.warn(
          `[REGISTRY-AGENT] StockItem REJECTED by hash. Skipping.`,
        );
      } else {
        this.logger.log(
          `[REGISTRY-AGENT] StockItem idempotency hit (${existingByHash.status}). Skipping.`,
        );
      }
      return;
    }

    const accountId = await this.resolveAccountId(observation);

    // 2. Создание черновика
    const draft = await this.prisma.stockItem.create({
      data: {
        name: metadata.name,
        type: metadata.type as StockItemType,
        quantity: metadata.quantity,
        unit: metadata.unit,
        status: AssetStatus.PENDING_CONFIRMATION,
        idempotencyKey,
        companyId: observation.companyId,
        accountId,
      },
    });

    this.logger.log(`[REGISTRY-AGENT] Created DRAFT StockItem: ${draft.id}`);

    // 3. Уведомление
    await this.telegram.sendAssetProposal(observation.authorId, {
      id: draft.id,
      type: "STOCK",
      ...metadata,
    });
  }

  private async resolveAccountId(
    observation: FieldObservation,
  ): Promise<string> {
    if (observation.fieldId) {
      const field = await this.prisma.field.findFirst({
        where: {
          id: observation.fieldId,
          companyId: observation.companyId,
        },
      });
      if (field) return field.clientId;
    }

    // Fallback: try to find client via User
    // Note: User type might still have clientId until regeneration, but we rely on prisma service to map it or user to be updated
    const user = await this.prisma.user.findFirst({
      where: {
        id: observation.authorId,
        companyId: observation.companyId,
      },
    });
    if (user?.accountId) return user.accountId;

    throw new Error(
      `Could not resolve AccountID for Observation ${observation.id}`,
    );
  }
}
