import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as crypto from 'crypto';

export type GovernanceAction = 'PANIC_HALT' | 'UPDATE_FORMULA' | 'REASSIGN_AUTHORITY' | 'EMERGENCY_ROLLBACK';

interface MultisigSession {
    sessionId: string;
    action: GovernanceAction;
    payload: any;
    targetThreshold: number; // N
    totalSigners: number;    // M
    signatures: Map<string, string>; // signerId => signature (hash of payload)
    expiresAt: number;
    executed: boolean;
}

/**
 * M-of-N Governance Service (Фаза 1)
 * Реализует паттерн Multi-Signature для институциональных контуров (например, 5-of-7).
 * Защищает систему от захвата контроля одним актором.
 */
@Injectable()
export class MultisigService {
    private readonly logger = new Logger(MultisigService.name);

    // In-memory sessions (Must be in Redis for Multi-node scaling in Phase 6)
    private readonly sessions = new Map<string, MultisigSession>();

    // 5-of-7 requirement
    private readonly DEFAULT_M = 7;
    private readonly DEFAULT_N = 5;

    // Timeout: 24h
    private readonly SESSION_EXPIRATION_MS = 24 * 60 * 60 * 1000;

    /**
     * Создание новой сессии мультиподписи
     */
    createSession(action: GovernanceAction, payload: any): MultisigSession {
        const sessionId = crypto.randomUUID();
        const session: MultisigSession = {
            sessionId,
            action,
            payload,
            targetThreshold: this.DEFAULT_N,
            totalSigners: this.DEFAULT_M,
            signatures: new Map(),
            expiresAt: Date.now() + this.SESSION_EXPIRATION_MS,
            executed: false
        };

        this.sessions.set(sessionId, session);
        this.logger.warn(`[M-of-N] New GOVERNANCE Session created: ${sessionId} | Action: ${action} | Threshold: ${session.targetThreshold}/${session.totalSigners}`);
        return session;
    }

    /**
     * Проставление подписи Оракулом / Governance-членом
     */
    provideSignature(sessionId: string, signerId: string, signature: string): MultisigSession {
        const session = this.getSession(sessionId);

        // Verification logic (E.g. ecrecover over payload hash)
        // Here we assume signature comes validated from external EdDSA logic or Auth layer
        if (session.signatures.has(signerId)) {
            throw new HttpException('Signer already approved this session', HttpStatus.CONFLICT);
        }

        session.signatures.set(signerId, signature);
        this.logger.log(`[M-of-N] Session ${sessionId}: Signature added by ${signerId} (${session.signatures.size}/${session.targetThreshold} required)`);

        return session;
    }

    /**
     * Проверка: Можно ли выполнить действие
     */
    isActionExecutable(sessionId: string): boolean {
        const session = this.getSession(sessionId);
        return session.signatures.size >= session.targetThreshold && !session.executed;
    }

    /**
     * Отметить сессию как исполненную
     */
    markExecuted(sessionId: string) {
        const session = this.getSession(sessionId);
        if (!this.isActionExecutable(sessionId)) {
            throw new HttpException('Cannot execute: threshold not met', HttpStatus.FORBIDDEN);
        }
        session.executed = true;
        this.logger.warn(`[M-of-N] Session ${sessionId} EXECUTED! Activating strictly gated logic.`);
    }

    private getSession(sessionId: string): MultisigSession {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new HttpException(`Session ${sessionId} not found`, HttpStatus.NOT_FOUND);
        }
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            throw new HttpException(`Session ${sessionId} expired`, HttpStatus.GONE);
        }
        return session;
    }
}
