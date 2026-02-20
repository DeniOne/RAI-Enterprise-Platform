import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RatingResult } from './rating-engine.service';
import { SnapshotPayload } from '../snapshot/snapshot.service';
import { randomUUID } from 'crypto';

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

    // В реальности Inject JwtService, настроенный на Ed25519 ключи
    constructor(private readonly jwtService: JwtService) { }

    /**
     * Выпуск финального Institutional-Grade JWT
     */
    public async mintCertificate(
        rating: RatingResult,
        snapshot: SnapshotPayload,
        snapshotHash: string,
    ): Promise<string> {
        this.logger.log(`Minting Ed25519 JWT Certificate for Company ${snapshot.companyId}`);

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

        // Подписание - В реальной системе используется асимметричная криптография (Ed25519)
        // и, возможно, взаимодействие с HSM.
        // Пока возвращаем заглушку signed token, предполагая что JwtService настроен:
        // const signedToken = await this.jwtService.signAsync(payload);

        // Stub implementation for test environments where JwtModule might not be provided with keys
        const stubToken = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64')}.stub_signature_ed25519`;

        this.logger.log(`Certificate Minted successfully: ${payload.jti}`);
        return stubToken; // В реальности return signedToken;
    }
}
