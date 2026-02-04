import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

@Injectable()
export class PulseService {
    constructor(private readonly prisma: PrismaService) { }

    async createSurvey(data: { title: string; questions: any }, companyId: string) {
        return this.prisma.pulseSurvey.create({
            data: {
                title: data.title,
                questions: data.questions,
                company: { connect: { id: companyId } },
            },
        });
    }

    /**
     * Survey responses are immutable.
     */
    async submitResponse(data: { pulseSurveyId: string; respondentId: string; answers: any }) {
        return this.prisma.surveyResponse.create({
            data: {
                pulseSurvey: { connect: { id: data.pulseSurveyId } },
                respondent: { connect: { id: data.respondentId } },
                answers: data.answers,
            },
        });
    }
}
