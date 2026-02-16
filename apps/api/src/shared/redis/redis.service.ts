import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    private readonly client: Redis;

    constructor(private configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL');
        this.client = new Redis(redisUrl);
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        try {
            if (this.client.status !== 'ready') {
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

    async get(key: string): Promise<string | null> {
        try {
            if (this.client.status !== 'ready') {
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
}
