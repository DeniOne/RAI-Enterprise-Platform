import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { S3Service } from '../../../shared/s3/s3.service';

export interface RegisterModelDto {
    name: string;
    version: number;
    hash: string;
    parentHash?: string;
    signature: string;
    artifactPath: string;
    trainingRunId?: string;
}

@Injectable()
export class ModelRegistryService {
    private readonly logger = new Logger(ModelRegistryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly s3: S3Service,
    ) { }

    /**
     * Регистрация новой версии модели.
     * SQL-триггеры на уровне БД проверят lineage и хеши.
     */
    async registerModel(companyId: string, dto: RegisterModelDto) {
        this.logger.log(`🏗️ Registering model ${dto.name} v${dto.version} for company ${companyId}`);

        // Проверка целостности артефакта в S3
        const isArtifactValid = await this.s3.validateObjectIntegrity(dto.artifactPath, dto.hash);
        if (!isArtifactValid) {
            throw new BadRequestException('Artifact integrity check failed (S3 existence or hash mismatch).');
        }

        return await this.prisma.modelVersion.create({
            data: {
                ...dto,
                companyId,
                status: 'SHADOW',
            },
        });
    }

    /**
     * Продвижение модели в Canary. Доступно только после BiasAudit (бизнес-правило).
     */
    async promoteToCanary(companyId: string, modelId: string) {
        this.logger.log(`🚀 Promoting model ${modelId} to CANARY`);

        // В Phase A это делается вручную или через оркестратор
        return await this.prisma.modelVersion.update({
            where: { id: modelId, companyId },
            data: { status: 'CANARY' },
        });
    }

    async getLatestActiveModel(companyId: string, featureId: string) {
        return await this.prisma.modelVersion.findFirst({
            where: { name: featureId, companyId, status: 'ACTIVE' },
            orderBy: { version: 'desc' },
        });
    }
}
