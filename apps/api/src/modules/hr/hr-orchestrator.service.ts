import { Injectable, Logger } from '@nestjs/common';
import { PulseService } from './development/pulse.service';
import { AssessmentService } from './development/assessment.service';
import { RiskLevel } from '@rai/prisma-client';

@Injectable()
export class HrOrchestratorService {
    private readonly logger = new Logger(HrOrchestratorService.name);

    constructor(
        private readonly pulseService: PulseService,
        private readonly assessmentService: AssessmentService,
    ) { }

    /**
     * Обработка результатов опроса и генерация снепшота состояния (Brain logic)
     */
    async handlePulseSubmission(
        data: {
            pulseSurveyId: string;
            respondentId: string;
            answers: any;
            employeeId: string; // В контексте бота respondentId обычно равен employeeId или связан
        },
        companyId: string,
    ) {
        this.logger.log(`Processing pulse submission for employee ${data.employeeId}`);

        // 1. Сохраняем ответы через IO-сервис
        const response = await this.pulseService.submitResponse({
            pulseSurveyId: data.pulseSurveyId,
            respondentId: data.respondentId,
            answers: data.answers,
        });

        // 2. Скоринг (Brain Logic)
        // В реальности здесь может быть сложный алгоритм или вызов AI
        // Для B2 используем простую эвристику на основе JSON ответов
        const { engagementLevel, burnoutRisk } = this.calculateScores(data.answers);

        // 3. Создаем снепшот состояния (Fact creation)
        const snapshot = await this.assessmentService.createSnapshot(
            {
                employeeId: data.employeeId,
                burnoutRisk,
                engagementLevel,
                ethicalAlignment: 1.0, // Default/Placeholder
                controllability: 1.0,    // Default/Placeholder
                confidenceLevel: 0.85,  // Уровень уверенности на основе полноты ответов
            },
            companyId,
        );

        return {
            responseId: response.id,
            snapshotId: snapshot.id,
            scores: { engagementLevel, burnoutRisk },
        };
    }

    private calculateScores(answers: any) {
        // Заглушка логики скоринга
        // Допустим, ответы это объект с ключами-вопросами и значениями 1-5
        const values = Object.values(answers).filter(v => typeof v === 'number') as number[];
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 3;

        // Engagement: нормализуем 1-5 в 0.0-1.0
        const engagementLevel = avg / 5;

        // BurnoutRisk: если средний балл низкий (< 2), то риск высокий
        let burnoutRisk: RiskLevel = RiskLevel.LOW;
        if (avg < 2) burnoutRisk = RiskLevel.HIGH;
        else if (avg < 3.5) burnoutRisk = RiskLevel.MEDIUM;

        return { engagementLevel, burnoutRisk };
    }
}
