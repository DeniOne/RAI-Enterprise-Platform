import { Injectable, Logger } from '@nestjs/common';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import { RedisService } from '../redis/redis.service';
import { SecretsService } from '../config/secrets.service';

type OutboxBrokerTransport = 'http' | 'redis_streams';

interface OutboxBrokerMessage {
  id: string;
  type: string;
  aggregateId?: string | null;
  aggregateType?: string | null;
  payload: any;
  createdAt: Date;
}

@Injectable()
export class OutboxBrokerPublisher {
  private readonly logger = new Logger(OutboxBrokerPublisher.name);
  private readonly transport = this.resolveTransport();
  private readonly endpoint = process.env.OUTBOX_BROKER_ENDPOINT || '';
  private readonly timeoutMs = Number(
    process.env.OUTBOX_BROKER_TIMEOUT_MS || 5000,
  );
  private readonly redisStreamKey =
    process.env.OUTBOX_BROKER_REDIS_STREAM_KEY || 'rai:outbox';
  private readonly redisStreamMaxLen = Number(
    process.env.OUTBOX_BROKER_REDIS_STREAM_MAXLEN || 0,
  );
  private readonly redisTenantPartitioning =
    (process.env.OUTBOX_BROKER_REDIS_TENANT_PARTITIONING || 'false')
      .toLowerCase()
      .trim() === 'true';

  constructor(
    private readonly redisService: RedisService,
    private readonly secretsService: SecretsService,
  ) {}

  isConfigured(): boolean {
    switch (this.transport) {
      case 'http':
        return this.endpoint.trim().length > 0;
      case 'redis_streams':
        return this.redisStreamKey.trim().length > 0;
      default:
        return false;
    }
  }

  requiredConfigHint(): string {
    return this.transport === 'redis_streams'
      ? 'OUTBOX_BROKER_REDIS_STREAM_KEY'
      : 'OUTBOX_BROKER_ENDPOINT';
  }

  getTransport(): OutboxBrokerTransport {
    return this.transport;
  }

  async publish(message: OutboxBrokerMessage): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(`${this.requiredConfigHint()} is not configured`);
    }

    switch (this.transport) {
      case 'http':
        await this.publishHttp(message);
        return;
      case 'redis_streams':
        await this.publishRedisStreams(message);
        return;
      default: {
        const exhaustiveCheck: never = this.transport;
        throw new Error(`Unsupported outbox broker transport: ${exhaustiveCheck}`);
      }
    }
  }

  describeConfig(): string {
    if (!this.isConfigured()) {
      return `transport=${this.transport}:missing-config`;
    }

    if (this.transport === 'redis_streams') {
      return [
        'transport=redis_streams',
        `stream=${this.redisStreamKey}`,
        `tenantPartitioning=${this.redisTenantPartitioning}`,
        `maxLen=${this.redisStreamMaxLen > 0 ? this.redisStreamMaxLen : 'off'}`,
      ].join(',');
    }

    try {
      const target = new URL(this.endpoint);
      return `transport=http,target=${target.protocol}//${target.host}${target.pathname}`;
    } catch {
      this.logger.warn('OUTBOX_BROKER_ENDPOINT is set, but URL parsing failed');
      return 'transport=http,target=invalid-url';
    }
  }

  private resolveTransport(): OutboxBrokerTransport {
    const value = (process.env.OUTBOX_BROKER_TRANSPORT || 'http')
      .toLowerCase()
      .trim();

    return value === 'redis_streams' ? 'redis_streams' : 'http';
  }

  private async publishHttp(message: OutboxBrokerMessage): Promise<void> {
    const body = JSON.stringify({
      id: message.id,
      type: message.type,
      aggregateId: message.aggregateId ?? null,
      aggregateType: message.aggregateType ?? null,
      payload: message.payload,
      createdAt: message.createdAt,
    });

    const target = new URL(this.endpoint);
    const isHttps = target.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    const companyId = this.extractCompanyId(message.payload);

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      throw new Error(
        `Unsupported broker protocol: ${target.protocol || 'unknown'}`,
      );
    }

    await new Promise<void>((resolve, reject) => {
      const req = requestFn(
        {
          protocol: target.protocol,
          hostname: target.hostname,
          port: target.port || (isHttps ? 443 : 80),
          path: `${target.pathname}${target.search}`,
          method: 'POST',
          timeout: this.timeoutMs,
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
            'x-outbox-event-id': message.id,
            'x-outbox-event-type': message.type,
            ...(companyId ? { 'x-outbox-company-id': companyId } : {}),
            ...(this.getAuthToken()
              ? { authorization: `Bearer ${this.getAuthToken()}` }
              : {}),
          },
        },
        (res) => {
          const statusCode = res.statusCode || 0;
          res.resume();
          if (statusCode >= 200 && statusCode < 300) {
            resolve();
            return;
          }
          reject(new Error(`Broker publish failed with status ${statusCode}`));
        },
      );

      req.on('timeout', () => {
        req.destroy(
          new Error(`Broker publish timeout after ${this.timeoutMs}ms`),
        );
      });
      req.on('error', (error) => {
        reject(error);
      });

      req.write(body);
      req.end();
    });
  }

  private async publishRedisStreams(
    message: OutboxBrokerMessage,
  ): Promise<void> {
    const companyId = this.extractCompanyId(message.payload);
    const streamKey = this.resolveRedisStreamKey(companyId);

    await this.redisService.xadd(
      streamKey,
      {
        eventId: message.id,
        eventType: message.type,
        aggregateId: message.aggregateId ?? '',
        aggregateType: message.aggregateType ?? '',
        companyId: companyId ?? '',
        createdAt: new Date(message.createdAt).toISOString(),
        payload: JSON.stringify(message.payload ?? {}),
      },
      {
        maxLen: this.redisStreamMaxLen > 0 ? this.redisStreamMaxLen : undefined,
      },
    );
  }

  private resolveRedisStreamKey(companyId: string | null): string {
    if (this.redisTenantPartitioning && companyId) {
      return `${this.redisStreamKey}:${companyId}`;
    }
    return this.redisStreamKey;
  }

  private extractCompanyId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidate = (payload as Record<string, unknown>).companyId;
    return typeof candidate === 'string' && candidate.trim().length > 0
      ? candidate
      : null;
  }

  private getAuthToken(): string {
    return this.secretsService.getOptionalSecret('OUTBOX_BROKER_AUTH_TOKEN') || '';
  }
}
