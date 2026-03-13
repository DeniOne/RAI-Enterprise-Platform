import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>("REDIS_URL");
    this.client = new Redis(redisUrl);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (this.client.status !== "ready") {
        console.warn(`[Redis] Not ready, skipping set for key: ${key}`);
        return;
      }
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      console.error(`[Redis] Set error for key ${key}:`, error);
    }
  }

  async setNX(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    try {
      if (this.client.status !== "ready") return false;
      const result = await this.client.set(key, value, "EX", ttlSeconds, "NX");
      return result === "OK";
    } catch (error) {
      console.error(`[Redis] setNX error for key ${key}:`, error);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (this.client.status !== "ready") {
        console.warn(`[Redis] Not ready, returning null for key: ${key}`);
        return null;
      }
      return await this.client.get(key);
    } catch (error) {
      console.error(`[Redis] Get error for key ${key}:`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  isReady(): boolean {
    return this.client.status === "ready";
  }

  async xadd(
    streamKey: string,
    fields: Record<string, string>,
    options?: { maxLen?: number },
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error(
        `[Redis] Not ready, cannot XADD to stream: ${streamKey}`,
      );
    }

    const args: string[] = [streamKey];
    if (options?.maxLen && options.maxLen > 0) {
      args.push("MAXLEN", "~", String(options.maxLen));
    }
    args.push("*");

    for (const [key, value] of Object.entries(fields)) {
      args.push(key, value);
    }

    return (await this.client.call("XADD", ...args)) as string;
  }

  async publish(channel: string, message: string): Promise<number> {
    if (!this.isReady()) {
      throw new Error(
        `[Redis] Not ready, cannot PUBLISH to channel: ${channel}`,
      );
    }

    return this.client.publish(channel, message);
  }

  async subscribe(
    channel: string,
    handler: (message: string, channel: string) => void | Promise<void>,
  ): Promise<() => Promise<void>> {
    const subscriber = this.client.duplicate();
    const listener = (receivedChannel: string, message: string) => {
      if (receivedChannel !== channel) {
        return;
      }
      void handler(message, receivedChannel);
    };

    subscriber.on("message", listener);
    await subscriber.subscribe(channel);

    return async () => {
      subscriber.off("message", listener);
      try {
        await subscriber.unsubscribe(channel);
      } finally {
        subscriber.disconnect();
      }
    };
  }

  async ensureConsumerGroup(
    streamKey: string,
    groupName: string,
    startId: string = "$",
  ): Promise<void> {
    if (!this.isReady()) {
      throw new Error(
        `[Redis] Not ready, cannot ensure consumer group for stream: ${streamKey}`,
      );
    }

    try {
      await this.client.call(
        "XGROUP",
        "CREATE",
        streamKey,
        groupName,
        startId,
        "MKSTREAM",
      );
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      if (message.includes("BUSYGROUP")) {
        return;
      }
      throw error;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    this.client.disconnect();
  }
}
