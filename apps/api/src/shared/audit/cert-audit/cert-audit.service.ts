import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CertAuditStatus } from '@rai/prisma-client';

@Injectable()
export class CertAuditService {
    private readonly logger = new Logger(CertAuditService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Записывает намерение подписать снимок данных.
     * Вызывается ПЕРЕД обращением к HSM/ключам.
     */
    async logSignatureIntent(params: {
        companyId: string;
        initiatorProcess: string;
        snapshotHash: string;
        kidUsed: string;
        quorumReceipt?: string;
    }) {
        this.logger.log(`SIGNATURE_INTENT: process=${params.initiatorProcess}, hash=${params.snapshotHash}`);

        return this.prisma.levelFCertAudit.create({
            data: {
                companyId: params.companyId,
                initiatorProcess: params.initiatorProcess,
                snapshotHash: params.snapshotHash,
                kidUsed: params.kidUsed,
                quorumReceipt: params.quorumReceipt,
                status: CertAuditStatus.SIGNATURE_INTENT,
            },
        });
    }

    /**
     * Записывает факт успешного подписания.
     * Создает новую запись в Append-Only журнале.
     */
    async logSignatureCompleted(params: {
        companyId: string;
        initiatorProcess: string;
        snapshotHash: string;
        kidUsed: string;
    }) {
        this.logger.log(`SIGNATURE_COMPLETED: process=${params.initiatorProcess}, hash=${params.snapshotHash}`);

        return this.prisma.levelFCertAudit.create({
            data: {
                companyId: params.companyId,
                initiatorProcess: params.initiatorProcess,
                snapshotHash: params.snapshotHash,
                kidUsed: params.kidUsed,
                status: CertAuditStatus.SIGNATURE_COMPLETED,
            },
        });
    }

    /**
     * Записывает ошибку подписания (например, HSM недоступен).
     */
    async logSignatureError(params: {
        companyId: string;
        initiatorProcess: string;
        snapshotHash: string;
        kidUsed: string;
        errorReason: string;
    }) {
        this.logger.error(`SIGNATURE_ERROR: process=${params.initiatorProcess}, hash=${params.snapshotHash} | Reason: ${params.errorReason}`);

        return this.prisma.levelFCertAudit.create({
            data: {
                companyId: params.companyId,
                initiatorProcess: params.initiatorProcess,
                snapshotHash: params.snapshotHash,
                kidUsed: params.kidUsed,
                status: CertAuditStatus.ERROR,
            },
        });
    }
}
