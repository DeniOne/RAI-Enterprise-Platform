import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxStatus, Prisma } from "@rai/prisma-client";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvariantMetrics } from "../invariants/invariant-metrics";
import { OutboxBrokerPublisher } from "./outbox-broker.publisher";
import { isEventVersionAllowed } from "./event-contracts";

type DeliveryMode = "local_only" | "broker_only" | "dual";

@Injectable()
export class OutboxRelay implements OnApplicationBootstrap {
  private readonly logger = new Logger(OutboxRelay.name);
  private isProcessing = false;
  private readonly relayEnabled =
    (process.env.OUTBOX_RELAY_ENABLED || "true").toLowerCase() !== "false";
  private readonly scheduleEnabled =
    (process.env.OUTBOX_RELAY_SCHEDULE_ENABLED || "true").toLowerCase() !==
    "false";
  private readonly bootstrapDrainEnabled =
    (process.env.OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED || "true")
      .toLowerCase() !== "false";
  private readonly batchSize = Number(process.env.OUTBOX_RELAY_BATCH_SIZE || 50);
  private readonly maxRetries = Number(process.env.OUTBOX_MAX_RETRIES || 5);
  private readonly retryBaseDelayMs = Number(
    process.env.OUTBOX_RETRY_BASE_DELAY_MS || 1000,
  );
  private readonly orderingDeferMs = Number(
    process.env.OUTBOX_ORDERING_DEFER_MS || 1000,
  );
  private readonly processingStaleAfterMs = Number(
    process.env.OUTBOX_PROCESSING_STALE_AFTER_MS || 60000,
  );
  private readonly allowLocalOnlyInProduction =
    (process.env.OUTBOX_ALLOW_LOCAL_ONLY_IN_PRODUCTION || "false")
      .toLowerCase() === "true";
  private readonly deliveryMode = this.resolveDeliveryMode();
  private readonly enforceEventContract =
    (process.env.OUTBOX_EVENT_CONTRACT_ENFORCE || "true").toLowerCase() !==
    "false";
  private readonly nodeEnv = (process.env.NODE_ENV || "development")
    .toLowerCase()
    .trim();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly brokerPublisher: OutboxBrokerPublisher,
  ) {}

  onApplicationBootstrap() {
    this.validateRuntimeConfig();
    this.logger.log(
      `Outbox Relay initialized. enabled=${this.relayEnabled}, scheduleEnabled=${this.scheduleEnabled}, bootstrapDrainEnabled=${this.bootstrapDrainEnabled}, batchSize=${this.batchSize}, processingStaleAfterMs=${this.processingStaleAfterMs}, deliveryMode=${this.deliveryMode}, broker=${this.brokerPublisher.describeConfig()}`,
    );

    if (!this.relayEnabled || !this.bootstrapDrainEnabled) {
      return;
    }

    void this.processOutbox();
  }

  @Cron(CronExpression.EVERY_SECOND)
  async handleScheduledRelay() {
    if (!this.relayEnabled || !this.scheduleEnabled) {
      return;
    }
    await this.processOutbox();
  }

  async processOutbox() {
    if (!this.relayEnabled) {
      return;
    }
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      await this.recoverStaleProcessingMessages();
      const messages = await this.claimPendingMessages(this.batchSize);

      if (messages.length === 0) {
        return;
      }

      this.logger.debug(`Processing ${messages.length} outbox messages...`);

      for (const msg of messages) {
        try {
          if (await this.hasEarlierInFlightForStream(msg)) {
            const nextRetryAt = new Date(Date.now() + this.orderingDeferMs);
            this.logger.warn(
              `Deferring out-of-order event ${msg.id} for stream ${this.streamKey(msg)} until ${nextRetryAt.toISOString()}`,
            );
            await (this.prisma as any).outboxMessage.update({
              where: { id: msg.id },
              data: {
                status: OutboxStatus.PENDING,
                nextRetryAt,
                error: "Deferred by stream-ordering guard",
              },
            });
            continue;
          }

          if (!this.hasTenantContract(msg)) {
            InvariantMetrics.incrementTenantViolation(
              "UNKNOWN_TENANT",
              "OutboxRelay",
            );
            const error = `Outbox tenant contract violation for message ${msg.id} (${msg.type})`;
            this.logger.error(error);
            await this.prisma.outboxMessage.update({
              where: { id: msg.id },
              data: { status: OutboxStatus.FAILED, error },
            });
            continue;
          }

          if (!this.hasValidEventContract(msg)) {
            const err = `Outbox event contract violation for message ${msg.id} (${msg.type}): invalid eventVersion`;
            if (this.enforceEventContract) {
              await this.prisma.outboxMessage.update({
                where: { id: msg.id },
                data: {
                  status: OutboxStatus.FAILED,
                  error: err,
                  deadLetterAt: new Date(),
                },
              });
              continue;
            }
            this.logger.warn(err);
          }

          await this.deliverBrokerIfNeeded(msg);
          await this.deliverLocalIfNeeded(msg);
          await this.finalizeProcessedMessage(msg);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          const latest = await (this.prisma as any).outboxMessage.findUnique({
            where: { id: msg.id },
            select: { attempts: true },
          });
          const attempts = Number(latest?.attempts || 1);

          if (attempts >= this.maxRetries) {
            this.logger.error(
              `Failed to process message ${msg.id}: ${errorMessage} (DLQ)`,
            );
            await (this.prisma as any).outboxMessage.update({
              where: { id: msg.id },
              data: {
                status: OutboxStatus.FAILED,
                error: errorMessage,
                deadLetterAt: new Date(),
                nextRetryAt: null,
              },
            });
          } else {
            const delayMs = this.calculateBackoffMs(attempts);
            const nextRetryAt = new Date(Date.now() + delayMs);
            this.logger.warn(
              `Failed to process message ${msg.id}: ${errorMessage}. Retry ${attempts}/${this.maxRetries} at ${nextRetryAt.toISOString()}`,
            );
            await (this.prisma as any).outboxMessage.update({
              where: { id: msg.id },
              data: {
                status: OutboxStatus.PENDING,
                error: errorMessage,
                nextRetryAt,
              },
            });
          }
        }
      }
    } catch (error) {
      this.logger.error("Critical error in Outbox Relay loop", error);
    } finally {
      this.isProcessing = false;
    }
  }

  private validateRuntimeConfig(): void {
    if (!this.relayEnabled) {
      return;
    }

    if (
      this.nodeEnv === "production" &&
      this.deliveryMode === "local_only" &&
      !this.allowLocalOnlyInProduction
    ) {
      throw new Error(
        "OUTBOX_DELIVERY_MODE=local_only is forbidden in production without OUTBOX_ALLOW_LOCAL_ONLY_IN_PRODUCTION=true",
      );
    }

    if (this.shouldDeliverBroker() && !this.brokerPublisher.isConfigured()) {
      throw new Error(
        `OUTBOX_DELIVERY_MODE=${this.deliveryMode} requires ${this.brokerPublisher.requiredConfigHint()}`,
      );
    }
  }

  private resolveDeliveryMode(): DeliveryMode {
    const configured = (process.env.OUTBOX_DELIVERY_MODE || "")
      .toLowerCase()
      .trim();

    if (
      configured === "local_only" ||
      configured === "broker_only" ||
      configured === "dual"
    ) {
      return configured;
    }

    return (process.env.NODE_ENV || "development").toLowerCase() ===
      "production"
      ? "dual"
      : "local_only";
  }

  private async recoverStaleProcessingMessages(): Promise<void> {
    const cutoff = new Date(Date.now() - this.processingStaleAfterMs);
    const result = await (this.prisma as any).outboxMessage.updateMany({
      where: {
        status: OutboxStatus.PROCESSING,
        OR: [
          { lastAttemptAt: { lt: cutoff } },
          {
            lastAttemptAt: null,
            updatedAt: { lt: cutoff },
          },
        ],
      },
      data: {
        status: OutboxStatus.PENDING,
        nextRetryAt: null,
        error: `Recovered stale PROCESSING lease after ${this.processingStaleAfterMs}ms`,
      },
    });

    if (result.count > 0) {
      this.logger.warn(
        `Recovered ${result.count} stale outbox messages from PROCESSING back to PENDING`,
      );
    }
  }

  private async publishToBroker(msg: any) {
    await this.brokerPublisher.publish({
      id: msg.id,
      type: msg.type,
      aggregateId: msg.aggregateId,
      aggregateType: msg.aggregateType,
      payload: msg.payload,
      createdAt: msg.createdAt,
    });
    this.logger.log(
      `[Broker] Published: ${msg.type} (Agg: ${msg.aggregateId || "N/A"})`,
    );
  }

  private async deliverBrokerIfNeeded(msg: any): Promise<void> {
    if (!this.shouldDeliverBroker() || msg.brokerDeliveredAt) {
      return;
    }

    await this.publishToBroker(msg);
    const deliveredAt = new Date();
    await this.prisma.outboxMessage.update({
      where: { id: msg.id },
      data: {
        brokerDeliveredAt: deliveredAt,
        error: null,
      },
    });
    msg.brokerDeliveredAt = deliveredAt;
  }

  private async deliverLocalIfNeeded(msg: any): Promise<void> {
    if (!this.shouldDeliverLocal() || msg.localDeliveredAt) {
      return;
    }

    this.logger.debug(`Relaying event ${msg.type} to local EventEmitter`);
    await this.emitLocal(msg.type, msg.payload);

    const deliveredAt = new Date();
    await this.prisma.outboxMessage.update({
      where: { id: msg.id },
      data: {
        localDeliveredAt: deliveredAt,
        error: null,
      },
    });
    msg.localDeliveredAt = deliveredAt;
  }

  private async emitLocal(type: string, payload: unknown): Promise<void> {
    const emitter = this.eventEmitter as any;
    if (typeof emitter.emitAsync === "function") {
      await emitter.emitAsync(type, payload);
      return;
    }
    emitter.emit(type, payload);
  }

  private async finalizeProcessedMessage(msg: any): Promise<void> {
    if (this.shouldDeliverBroker() && !msg.brokerDeliveredAt) {
      return;
    }
    if (this.shouldDeliverLocal() && !msg.localDeliveredAt) {
      return;
    }

    await this.prisma.outboxMessage.update({
      where: { id: msg.id },
      data: {
        status: OutboxStatus.PROCESSED,
        error: null,
        nextRetryAt: null,
        deadLetterAt: null,
      },
    });
  }

  private hasTenantContract(msg: any): boolean {
    const payload = msg?.payload;
    if (!payload || typeof payload !== "object") {
      return false;
    }
    const companyId = payload.companyId;
    return typeof companyId === "string" && companyId.trim().length > 0;
  }

  private hasValidEventContract(msg: any): boolean {
    const payload = msg?.payload;
    if (!payload || typeof payload !== "object") {
      return false;
    }
    const version = payload.eventVersion;
    if (!Number.isInteger(version)) {
      return false;
    }
    return isEventVersionAllowed(msg.type, version);
  }

  private extractCompanyId(msg: any): string | null {
    const payload = msg?.payload;
    if (!payload || typeof payload !== "object") {
      return null;
    }
    const companyId = payload.companyId;
    if (typeof companyId === "string" && companyId.trim().length > 0) {
      return companyId;
    }
    return null;
  }

  private async claimPendingMessages(limit: number) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      return (tx as any).$queryRaw(
        Prisma.sql`
          WITH claimed AS (
            SELECT id, "createdAt"
            FROM outbox_messages
            WHERE status = 'PENDING'
              AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= ${now})
            ORDER BY "createdAt" ASC
            FOR UPDATE SKIP LOCKED
            LIMIT ${limit}
          ),
          updated AS (
            UPDATE outbox_messages AS target
            SET status = 'PROCESSING',
                attempts = target.attempts + 1,
                "lastAttemptAt" = NOW(),
                "nextRetryAt" = NULL,
                "updatedAt" = NOW()
            FROM claimed
            WHERE target.id = claimed.id
            RETURNING target.*
          )
          SELECT updated.*
          FROM updated
          INNER JOIN claimed ON claimed.id = updated.id
          ORDER BY claimed."createdAt" ASC
        `,
      );
    });
  }

  private calculateBackoffMs(attempts: number): number {
    const exp = Math.max(0, attempts - 1);
    const uncapped = this.retryBaseDelayMs * 2 ** exp;
    const capMs = 60_000;
    return Math.min(uncapped, capMs);
  }

  private shouldDeliverLocal(): boolean {
    return this.deliveryMode === "local_only" || this.deliveryMode === "dual";
  }

  private shouldDeliverBroker(): boolean {
    return this.deliveryMode === "broker_only" || this.deliveryMode === "dual";
  }

  private async hasEarlierInFlightForStream(msg: any): Promise<boolean> {
    const key = this.streamKey(msg);
    if (key === null) {
      return false;
    }

    const companyId = this.extractCompanyId(msg);
    const where: any = {
      id: { not: msg.id },
      status: OutboxStatus.PROCESSING,
      type: msg.type,
      aggregateType: msg.aggregateType ?? null,
      aggregateId: msg.aggregateId ?? null,
      createdAt: { lt: msg.createdAt },
    };

    // If tenant is present, isolate stream check to same tenant.
    if (companyId) {
      where.payload = {
        path: ["companyId"],
        equals: companyId,
      };
    }

    const older = await (this.prisma as any).outboxMessage.findFirst({
      where,
      select: { id: true },
    });
    return Boolean(older);
  }

  private streamKey(msg: any): string | null {
    if (!msg?.aggregateType || !msg?.aggregateId) {
      return null;
    }
    const companyId = this.extractCompanyId(msg) || "NO_TENANT";
    return `${companyId}:${msg.aggregateType}:${msg.aggregateId}:${msg.type}`;
  }
}
