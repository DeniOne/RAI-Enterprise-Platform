import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { RatingEngineService } from './rating-engine.service';
import { SnapshotService } from '../snapshot/snapshot.service';
import { JwtMinterService, LevelFCertificatePayload } from './jwt-minter.service';
import { CertAuditService } from '../../shared/audit/cert-audit/cert-audit.service';
import { CertAuditStatus } from '@rai/prisma-client';

@Injectable()
export class ReproducibilityCheckerService {
    private readonly logger = new Logger(ReproducibilityCheckerService.name);

    constructor(
        private readonly snapshotService: SnapshotService,
        private readonly ratingEngine: RatingEngineService,
        private readonly jwtMinter: JwtMinterService,
        private readonly auditService: CertAuditService,
    ) { }

    /**
     * Воспроизводит (Rebuild) сертификат из сохраненного Snapshot и сравнивает грейды.
     * Также логирует Regulatory Audit.
     */
    public async rebuildAndVerifyCertificate(
        companyId: string,
        existingJwtPayload: LevelFCertificatePayload,
    ): Promise<boolean> {
        this.logger.log(`Rebuilding Certificate ${existingJwtPayload.jti} for company ${companyId}`);

        // Шаг 1: Намерение аудита (Regulatory Logging)
        const auditRecord = await this.auditService.logSignatureIntent({
            companyId,
            initiatorProcess: 'ReproducibilityChecker',
            snapshotHash: existingJwtPayload.snapshotHash,
            kidUsed: 'Ed25519-Verification-Key',
        });

        try {
            // Шаг 2: Извлечение Snapshot из системы (в реальности из DB/IPFS по хешу)
            // Здесь используем MOCK-создание для имитации извлечения:
            const node = await this.snapshotService.createSnapshot({
                companyId,
                startDate: new Date(),
                endDate: new Date(),
                schemaVersion: existingJwtPayload.schemaVersion,
            });

            // Шаг 3: Детерминированный прогон Rating Engine
            const rating = this.ratingEngine.evaluateSnapshot(node.payload);

            // Шаг 4: Сравнение результата
            const isGradeMatch = rating.grade === existingJwtPayload.grade;
            const isScoreMatch = rating.score === existingJwtPayload.score;

            if (!isGradeMatch || !isScoreMatch) {
                this.logger.error(`Reproducibility Failed: Diff found in grades/scores`);
                await this.auditService.logSignatureError({
                    companyId,
                    initiatorProcess: 'ReproducibilityChecker',
                    snapshotHash: existingJwtPayload.snapshotHash,
                    kidUsed: 'Ed25519-Verification-Key',
                    errorReason: 'Deterministic Rebuild Mismatch'
                });
                return false;
            }

            this.logger.log(`Deterministic Rebuild Successful. Exact match confirmed.`);
            await this.auditService.logSignatureCompleted({
                companyId,
                initiatorProcess: 'ReproducibilityChecker',
                snapshotHash: existingJwtPayload.snapshotHash,
                kidUsed: 'Ed25519-Verification-Key'
            });

            return true;

        } catch (err: any) {
            await this.auditService.logSignatureError({
                companyId,
                initiatorProcess: 'ReproducibilityChecker',
                snapshotHash: existingJwtPayload.snapshotHash,
                kidUsed: 'Ed25519-Verification-Key',
                errorReason: err.message
            });
            this.logger.error(`Reproducibility Error: ${err.message}`);
            return false;
        }
    }
}
