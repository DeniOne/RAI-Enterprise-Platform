import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface UserSession {
    token: string;
    userId?: string;
    companyId?: string;
    lastActive: number;
}

@Injectable()
export class SessionService {
    private readonly SESSION_PREFIX = 'session:';
    private readonly DEFAULT_TTL = 86400; // 24 hours

    constructor(private readonly redis: RedisService) { }

    /**
     * Store or update user session.
     */
    async saveSession(telegramUserId: number | string, session: UserSession): Promise<void> {
        const key = this._getKey(telegramUserId);
        await this.redis.set(key, JSON.stringify(session), this.DEFAULT_TTL);
    }

    /**
     * Retrieve user session.
     */
    async getSession(telegramUserId: number | string): Promise<UserSession | null> {
        const key = this._getKey(telegramUserId);
        const data = await this.redis.get(key);
        if (!data) return null;
        try {
            return JSON.parse(data) as UserSession;
        } catch {
            return null;
        }
    }

    /**
     * Remove user session (logout/revoke).
     */
    async clearSession(telegramUserId: number | string): Promise<void> {
        const key = this._getKey(telegramUserId);
        await this.redis.del(key);
    }

    private _getKey(telegramUserId: number | string): string {
        return `${this.SESSION_PREFIX}${telegramUserId}`;
    }
}
