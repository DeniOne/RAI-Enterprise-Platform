import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CanonicalJsonBuilder } from '../../shared/crypto/canonical-json.builder';

export interface SnapshotPayload {
    companyId: string;
    nonce: number; // NTP timestamp in ms
    schemaVersion: string; // e.g., 'schema_v4.2'
    temporalBounds: {
        startDate: string;
        endDate: string;
    };
    lineageHash: string; // Hash of ML models
    previousHash: string; // S_{n-1} hash for DAG continuity
    rawSource: any[]; // Level E data tuples
}

export interface DAGNode {
    hash: string;
    payload: SnapshotPayload;
}

@Injectable()
export class SnapshotService {
    private readonly logger = new Logger(SnapshotService.name);

    // In-memory head for the DAG (In a real system, this would be persisted to DB)
    private dagHeadHash: string = 'genesis_hash';

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Сборка нового Snapshot
     */
    async createSnapshot(params: {
        companyId: string;
        startDate: Date;
        endDate: Date;
        schemaVersion?: string;
        lineageHash?: string;
    }): Promise<DAGNode> {
        this.logger.log(`Building Snapshot for company ${params.companyId} [${params.startDate.toISOString()} - ${params.endDate.toISOString()}]`);

        // 1. Raw Source: Выгрузка кортежей из БД (заглушка для реальной логики)
        // В реальной системе здесь будет сложный запрос к Level E метрикам
        const rawData = await this.prisma.company.findUnique({
            where: { id: params.companyId },
            select: {
                id: true,
                name: true,
            },
        });

        const payload: SnapshotPayload = {
            companyId: params.companyId,
            nonce: Date.now(),
            schemaVersion: params.schemaVersion || 'schema_v1.0',
            temporalBounds: {
                startDate: params.startDate.toISOString(),
                endDate: params.endDate.toISOString(),
            },
            lineageHash: params.lineageHash || 'default_lineage_hash',
            previousHash: this.dagHeadHash,
            rawSource: rawData ? [rawData] : [], // Подставляем выгруженные данные
        };

        // 2. DAG Continuity Check (Invariant S2) 
        // Поскольку мы сами собираем, мы просто прикрепляем текущий head.

        // 3. Сериализация и хеширование
        const canonicalPayload = CanonicalJsonBuilder.stringify(payload);
        const currentHash = CanonicalJsonBuilder.hash(canonicalPayload);

        this.logger.log(`Generated Snapshot Hash: ${currentHash}`);

        // Обновляем Head of Chain
        this.dagHeadHash = currentHash;

        return {
            hash: currentHash,
            payload,
        };
    }

    /**
     * Возвращает текущий Head of Chain
     */
    getHeadHash(): string {
        return this.dagHeadHash;
    }

    /**
     * Валидация внешнего Snapshot (для dispute / replication)
     * Проверяет DAG Continuity и Temporal Skew
     */
    validateIncomingSnapshot(node: DAGNode, trustedTimeMs: number, maxSkewMs: number = 300000): boolean {
        // S3: Skew Tolerance Invariant
        const skew = Math.abs(trustedTimeMs - node.payload.nonce);
        if (skew > maxSkewMs) {
            this.logger.error(`Temporal Skew Error: ${skew}ms exceeds max ${maxSkewMs}ms`);
            return false; // В реальности здесь бросался бы SAFE_HALT
        }

        // S2: DAG Continuity
        if (node.payload.previousHash !== this.dagHeadHash) {
            this.logger.error(`DAG Continuity Error: Invalid previous hash. Received: ${node.payload.previousHash}, Expected: ${this.dagHeadHash}`);
            throw new ConflictException('Invalid snapshot DAG continuity');
        }

        // Проверка хэша
        const canonicalStr = CanonicalJsonBuilder.stringify(node.payload);
        const computedHash = CanonicalJsonBuilder.hash(canonicalStr);

        if (computedHash !== node.hash) {
            this.logger.error(`Hash Mismatch. Received: ${node.hash}, Computed: ${computedHash}`);
            return false;
        }

        // Валидация успешна. Сдвигаем head (в реальности это делает консенсус)
        this.dagHeadHash = node.hash;
        return true;
    }
}
