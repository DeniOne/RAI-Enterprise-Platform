import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { OutboxStatus } from "@rai/prisma-client";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvariantMetrics } from "../invariants/invariant-metrics";
import { ConsumerIdempotencyService } from "./consumer-idempotency.service";
import { OutboxBrokerPublisher } from "./outbox-broker.publisher";
import { isEventVersionAllowed } from "./event-contracts";

@Injectable()
export class OutboxRelay implements OnApplicationBootstrap {
  private readonly logger = new Logger(OutboxRelay.name);
  private isProcessing = false;
  private readonly maxRetries = Number(process.env.OUTBOX_MAX_RETRIES || 5);
  private readonly retryBaseDelayMs = Number(
    process.env.OUTBOX_RETRY_BASE_DELAY_MS || 1000,
  );
  private readonly orderingDeferMs = Number(
    process.env.OUTBOX_ORDERING_DEFER_MS || 1000,
  );
  private readonly deliveryMode = (
    process.env.OUTBOX_DELIVERY_MODE || "local_only"
  ).toLowerCase();
  private readonly enforceEventContract =
    (process.env.OUTBOX_EVENT_CONTRACT_ENFORCE || "true").toLowerCase() !==
    "false";

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly consumerIdempotency: ConsumerIdempotencyService,
    private readonly brokerPublisher: OutboxBrokerPublisher,
  ) {}

  onApplicationBootstrap() {
    this.logger.log(
      `Outbox Relay initialized. deliveryMode=${this.deliveryMode}, broker=${this.brokerPublisher.describeConfig()}`,
    );
  }

  // @Cron(CronExpression.EVERY_SECOND) // Aggressive polling for Phase 1
  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const messages = await this.claimPendingMessages(50);

      if (messages.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.debug(`Processing ${messages.length} outbox messages...`);

      for (const msg of messages) {
        try {
          await (this.prisma as any).outboxMessage.update({
            where: { id: msg.id },
            data: {
              attempts: { increment: 1 },
              lastAttemptAt: new Date(),
              nextRetryAt: null,
            },
          });

          if (await this.isDuplicateProcessedEvent(msg)) {
            InvariantMetrics.increment("event_duplicates_prevented_total");
            await this.prisma.outboxMessage.update({
              where: { id: msg.id },
              data: {
                status: OutboxStatus.PROCESSED,
                error: null,
                nextRetryAt: null,
                deadLetterAt: null,
              },
            });
            continue;
          }

          const companyId = this.extractCompanyId(msg);
          const reserved = await this.consumerIdempotency.reserve({
            consumer: "local-event-emitter",
            eventId: msg.id,
            eventType: msg.type,
            aggregateId: msg.aggregateId,
            companyId,
          });
          if (!reserved) {
            InvariantMetrics.increment("event_duplicates_prevented_total");
            await this.prisma.outboxMessage.update({
              where: { id: msg.id },
              data: {
                status: OutboxStatus.PROCESSED,
                error: null,
                nextRetryAt: null,
                deadLetterAt: null,
              },
            });
            continue;
          }

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

          // Already marked as PROCESSING by the raw query above
          // await this.prisma.outboxMessage.update({ ... });

          if (this.shouldDeliverLocal()) {
            this.logger.debug(
              `Relaying event ${msg.type} to local EventEmitter`,
            );
            this.eventEmitter.emit(msg.type, msg.payload);
          }

          if (this.shouldDeliverBroker()) {
            await this.publishToBroker(msg);
          }

          // Mark as PROCESSED
          await this.prisma.outboxMessage.update({
            where: { id: msg.id },
            data: {
              status: OutboxStatus.PROCESSED,
              error: null,
              nextRetryAt: null,
              deadLetterAt: null,
            },
          });
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

  private async isDuplicateProcessedEvent(msg: any): Promise<boolean> {
    // Events without aggregateId cannot be deduplicated deterministically.
    if (!msg?.aggregateId || typeof msg.aggregateId !== "string") {
      return false;
    }

    const duplicate = await this.prisma.outboxMessage.findFirst({
      where: {
        id: { not: msg.id },
        status: OutboxStatus.PROCESSED,
        type: msg.type,
        aggregateId: msg.aggregateId,
      },
      select: { id: true },
    });

    return Boolean(duplicate);
  }

  private async claimPendingMessages(limit: number) {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const candidates = await (tx as any).outboxMessage.findMany({
        where: {
          status: "PENDING", // Force string literal to avoid enum casting issues
          OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
        },
        orderBy: { createdAt: "asc" },
        take: limit,
      });

      if (candidates.length === 0) {
        return [];
      }

      const ids = candidates.map((m) => m.id);
      await tx.outboxMessage.updateMany({
        where: {
          id: { in: ids },
          status: OutboxStatus.PENDING,
        },
        data: { status: OutboxStatus.PROCESSING },
      });

      return tx.outboxMessage.findMany({
        where: {
          id: { in: ids },
          status: OutboxStatus.PROCESSING,
        },
        orderBy: { createdAt: "asc" },
      });
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
