import { Injectable, Logger } from '@nestjs/common';
import { AssertionFencesService, FenceResult } from './assertion-fences.service';
import { SnapshotPayload } from '../snapshot/snapshot.service';

/**
 * Статуты Финальной Оценки Level F
 */
export enum CertificationGrade {
    AAA = 'AAA', // Наивысшая надежность, нулевой риск
    AA = 'AA',
    A = 'A',
    BBB = 'BBB',
    BB = 'BB',
    B = 'B',
    CCC = 'CCC',
    C = 'C',
    D = 'D', // Отказ в сертификации
}

export interface RatingResult {
    grade: CertificationGrade;
    fenceStatus: FenceResult;
    score: number;
    timestamp: Date;
}

@Injectable()
export class RatingEngineService {
    private readonly logger = new Logger(RatingEngineService.name);

    constructor(private readonly fences: AssertionFencesService) { }

    /**
     * Чистая функция: Snapshot -> RatingResult (Stateless Rating Rules Engine)
     */
    public evaluateSnapshot(payload: SnapshotPayload): RatingResult {
        this.logger.log(`Rating Engine invoked for company: ${payload.companyId}`);

        // Шаг 1. Жесткие Инварианты (Assertion Fences)
        const fenceResult = this.fences.evaluateFences(payload);

        if (!fenceResult.passed) {
            this.logger.warn(`Snapshot Fences Failed. Assigning Grade D for company ${payload.companyId}`);
            return {
                grade: CertificationGrade.D,
                fenceStatus: fenceResult,
                score: 0,
                timestamp: new Date(),
            };
        }

        // Шаг 2. Расчет скоринговой модели (Score) - в реальности ML / сложная формула из Level E.
        const aggregatedScore = this.calculateAggregateScore(payload.rawSource);

        // Шаг 3. Врата сертификации (Certification Gates / Rule Engine V1.0)
        const grade = this.assignGrade(aggregatedScore);

        this.logger.log(`Certification Complete for company ${payload.companyId}: Grade ${grade} (Score: ${aggregatedScore})`);

        return {
            grade,
            fenceStatus: fenceResult,
            score: aggregatedScore,
            timestamp: new Date(),
        };
    }

    private calculateAggregateScore(rawSource: any[]): number {
        // Stub
        let baseScore = 85;
        // Реальный расчет: weight * metric[i] + ... + R3_Discount
        return baseScore;
    }

    private assignGrade(score: number): CertificationGrade {
        if (score >= 95) return CertificationGrade.AAA;
        if (score >= 90) return CertificationGrade.AA;
        if (score >= 85) return CertificationGrade.A;
        if (score >= 80) return CertificationGrade.BBB;
        if (score >= 70) return CertificationGrade.BB;
        if (score >= 60) return CertificationGrade.B;
        if (score >= 50) return CertificationGrade.CCC;
        if (score >= 40) return CertificationGrade.C;
        return CertificationGrade.D;
    }
}
