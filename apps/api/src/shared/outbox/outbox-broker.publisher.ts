import { Injectable, Logger } from "@nestjs/common";
import { request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import { URL } from "url";

@Injectable()
export class OutboxBrokerPublisher {
  private readonly logger = new Logger(OutboxBrokerPublisher.name);
  private readonly endpoint = process.env.OUTBOX_BROKER_ENDPOINT || "";
  private readonly timeoutMs = Number(
    process.env.OUTBOX_BROKER_TIMEOUT_MS || 5000,
  );
  private readonly authToken = process.env.OUTBOX_BROKER_AUTH_TOKEN || "";

  async publish(message: {
    id: string;
    type: string;
    aggregateId?: string | null;
    aggregateType?: string | null;
    payload: any;
    createdAt: Date;
  }): Promise<void> {
    if (!this.endpoint) {
      throw new Error("OUTBOX_BROKER_ENDPOINT is not configured");
    }

    const body = JSON.stringify({
      id: message.id,
      type: message.type,
      aggregateId: message.aggregateId ?? null,
      aggregateType: message.aggregateType ?? null,
      payload: message.payload,
      createdAt: message.createdAt,
    });

    const target = new URL(this.endpoint);
    const isHttps = target.protocol === "https:";
    const requestFn = isHttps ? httpsRequest : httpRequest;

    await new Promise<void>((resolve, reject) => {
      const req = requestFn(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || (isHttps ? 443 : 80),
          path: `${target.pathname}${target.search}`,
          method: "POST",
          timeout: this.timeoutMs,
          headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body),
            ...(this.authToken
              ? { authorization: `Bearer ${this.authToken}` }
              : {}),
          },
        },
        (res) => {
          const statusCode = res.statusCode || 0;
          if (statusCode >= 200 && statusCode < 300) {
            resolve();
            return;
          }
          reject(new Error(`Broker publish failed with status ${statusCode}`));
        },
      );

      req.on("timeout", () => {
        req.destroy(
          new Error(`Broker publish timeout after ${this.timeoutMs}ms`),
        );
      });
      req.on("error", (error) => {
        reject(error);
      });

      req.write(body);
      req.end();
    });
  }

  describeConfig(): string {
    return this.endpoint ? "configured" : "missing-endpoint";
  }
}
