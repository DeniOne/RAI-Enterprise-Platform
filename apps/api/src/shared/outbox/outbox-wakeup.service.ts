import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

export interface OutboxWakeupHint {
  reason: string;
  eventType?: string | null;
  companyId?: string | null;
  count?: number | null;
  emittedAt: string;
}

@Injectable()
export class OutboxWakeupService implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxWakeupService.name);
  private readonly enabled =
    (process.env.OUTBOX_RELAY_WAKEUP_ENABLED || "true").toLowerCase() !==
    "false";
  private readonly channel =
    process.env.OUTBOX_RELAY_WAKEUP_CHANNEL || "rai:outbox:wakeup";
  private readonly subscriptions = new Set<() => Promise<void>>();

  constructor(private readonly redisService: RedisService) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  isAvailable(): boolean {
    return this.enabled && this.redisService.isReady();
  }

  describeConfig(): string {
    return `transport=redis_pubsub,enabled=${this.enabled},channel=${this.channel},ready=${this.redisService.isReady()}`;
  }

  async publishHint(
    partial: Omit<OutboxWakeupHint, "emittedAt">,
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (!this.redisService.isReady()) {
      this.logger.warn(
        `Redis not ready, skipping outbox wakeup publish for reason=${partial.reason}`,
      );
      return;
    }

    const hint: OutboxWakeupHint = {
      ...partial,
      emittedAt: new Date().toISOString(),
    };

    await this.redisService.publish(this.channel, JSON.stringify(hint));
  }

  async subscribe(
    handler: (hint: OutboxWakeupHint) => void | Promise<void>,
  ): Promise<() => Promise<void>> {
    if (!this.enabled || !this.redisService.isReady()) {
      return async () => undefined;
    }

    const unsubscribe = await this.redisService.subscribe(
      this.channel,
      async (message) => {
        const hint = this.parseHint(message);
        if (!hint) {
          return;
        }
        await handler(hint);
      },
    );

    this.subscriptions.add(unsubscribe);

    return async () => {
      if (!this.subscriptions.delete(unsubscribe)) {
        return;
      }
      await unsubscribe();
    };
  }

  async onModuleDestroy(): Promise<void> {
    const subscriptions = [...this.subscriptions];
    this.subscriptions.clear();
    await Promise.allSettled(subscriptions.map((unsubscribe) => unsubscribe()));
  }

  private parseHint(message: string): OutboxWakeupHint | null {
    try {
      const parsed = JSON.parse(message) as Partial<OutboxWakeupHint>;
      if (!parsed || typeof parsed.reason !== "string") {
        return null;
      }
      return {
        reason: parsed.reason,
        eventType:
          typeof parsed.eventType === "string" ? parsed.eventType : null,
        companyId:
          typeof parsed.companyId === "string" ? parsed.companyId : null,
        count: typeof parsed.count === "number" ? parsed.count : null,
        emittedAt:
          typeof parsed.emittedAt === "string"
            ? parsed.emittedAt
            : new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.warn(
        `Failed to parse outbox wakeup hint: ${error?.message || error}`,
      );
      return null;
    }
  }
}
