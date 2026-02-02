import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ContextService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST', 'localhost');
        const port = this.configService.get<number>('REDIS_PORT', 6379);

        this.redis = new Redis({
            host,
            port,
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
    }

    onModuleDestroy() {
        this.redis.disconnect();
    }

    async setContext(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }

    async getContext<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async deleteContext(key: string): Promise<void> {
        await this.redis.del(key);
    }

    async extendContext(key: string, ttlSeconds: number): Promise<void> {
        await this.redis.expire(key, ttlSeconds);
    }
}
