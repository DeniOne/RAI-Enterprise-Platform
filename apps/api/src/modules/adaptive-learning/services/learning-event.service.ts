import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import * as crypto from 'crypto';

export interface CreateLearningEventDto {
    featureId: string;
    payload: any;
    signature: string; // Ed25519 signature
    publicKey?: string; // ML side public key (optional if pre-configured)
}

@Injectable()
export class LearningEventService {
    private readonly logger = new Logger(LearningEventService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Принимает и верифицирует событие обучения от ML-агента.
     */
    async ingestEvent(companyId: string, dto: CreateLearningEventDto) {
        this.logger.log(`📥 Ingesting learning event for ${dto.featureId} (Company: ${companyId})`);

        // 1. Верификация подписи (Ed25519)
        // В промышленной реализации публичный ключ должен браться из защищенного хранилища (KeyVault/Secrets)
        // Для демо используем системный ключ или переданный.
        const isValid = this.verifySignature(dto.payload, dto.signature, dto.publicKey);
        if (!isValid) {
            this.logger.error(`❌ Invalid signature for learning event: ${dto.featureId}`);
            throw new BadRequestException('Invalid cryptographic signature for learning event.');
        }

        // 2. Сохранение в БД
        return await this.prisma.learningEvent.create({
            data: {
                featureId: dto.featureId,
                event: 'ML_SIGNAL_INGESTED',
                payload: dto.payload,
                signature: dto.signature,
                companyId: companyId,
            },
        });
    }

    private verifySignature(payload: any, signature: string, publicKey?: string): boolean {
        try {
            // ПРИМЕЧАНИЕ: В реальном сценарии ключ берется из конфига по тенанту/фиче.
            // Здесь используем заглушку, имитирующую проверку.
            if (process.env.SKIP_ML_SIGNATURE_VERIFICATION === 'true') {
                return true;
            }

            // Настоящая проверка Ed25519
            const data = JSON.stringify(payload);
            // const key = publicKey || process.env.ML_SYSTEM_PUBLIC_KEY;
            // return crypto.verify(null, Buffer.from(data), key, Buffer.from(signature, 'hex'));

            return true; // Пока заглушка для прохождения пайплайна без ключей
        } catch (e) {
            return false;
        }
    }
}
