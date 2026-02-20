import { Injectable, Logger } from '@nestjs/common';
import { RatingResult } from './rating-engine.service';
import { SnapshotPayload } from '../snapshot/snapshot.service';
import { randomUUID } from 'crypto';
import { HsmService } from '../crypto/hsm.service';

export interface LevelFCertificatePayload {
    jti: string;              // Уникальный ID Сертификата (защита от replay/idempotency)
    iss: string;              // Issuer (RAI Institutional Node)
    sub: string;              // Subject (Company ID)
    iat: number;              // Issued at
    exp: number;              // Expiration time
    grade: string;            // Оценка (AAA-D)
    score: number;            // Агрегированный балл
    snapshotHash: string;     // Ссылка на детерминированный Snapshot (DAG Root)
    schemaVersion: string;
}

@Injectable()
export class JwtMinterService {
    private readonly logger = new Logger(JwtMinterService.name);

    constructor(private readonly hsmService: HsmService) { }

    /**
     * Выпуск финального Institutional-Grade JWT
     * 100% анклавное подписание с использованием HSM
     */
    public async mintCertificate(
        rating: RatingResult,
        snapshot: SnapshotPayload,
        snapshotHash: string,
    ): Promise<string> {
        this.logger.log(`Minting Ed25519 JWT Certificate for Company ${snapshot.companyId} via Vault Enclave`);

        const payload: LevelFCertificatePayload = {
            jti: randomUUID(),
            iss: 'RAI_INSTITUTIONAL_ROOT',
            sub: snapshot.companyId,
            iat: Math.floor(Date.now() / 1000),
            // Срок годности 1 год (Phase 4 requirement)
            exp: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
            grade: rating.grade,
            score: rating.score,
            snapshotHash,
            schemaVersion: snapshot.schemaVersion,
        };

        // Header для JWT EdDSA
        const header = { alg: 'EdDSA', typ: 'JWT' };

        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const dataToSign = `${encodedHeader}.${encodedPayload}`;

        // Отправка в HSM (Анклавное подписание, RAM не видит Private Key)
        const signature = await this.hsmService.signEd25519(dataToSign);

        const signedToken = `${dataToSign}.${signature}`;

        this.logger.log(`Certificate Minted via HSM: ${payload.jti}`);
        return signedToken;
    }
}
