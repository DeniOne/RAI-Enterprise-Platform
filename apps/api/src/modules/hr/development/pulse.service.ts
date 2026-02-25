import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class PulseService {
  constructor(private readonly prisma: PrismaService) {}

  async createSurvey(
    data: { title: string; questions: any },
    companyId: string,
  ) {
    return this.prisma.pulseSurvey.create({
      data: {
        title: data.title,
        questions: data.questions,
        company: { connect: { id: companyId } },
      },
    });
  }

  async getActiveSurveys(companyId: string) {
    return this.prisma.pulseSurvey.findMany({
      where: {
        companyId,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Survey responses are immutable. Pure IO.
   */
  async submitResponse(
    data: { pulseSurveyId: string; respondentId: string; answers: any },
    companyId: string,
  ) {
    const survey = await this.prisma.pulseSurvey.findFirst({
      where: { id: data.pulseSurveyId, companyId },
      select: { id: true },
    });
    const respondent = await this.prisma.employeeProfile.findFirst({
      where: { id: data.respondentId, companyId },
      select: { id: true },
    });
    if (!survey || !respondent) {
      throw new Error("Survey or respondent not found for tenant");
    }

    return this.prisma.surveyResponse.create({
      // tenant-lint:ignore SurveyResponse has no companyId, tenant is enforced by validated survey/respondent
      data: {
        pulseSurvey: { connect: { id: survey.id } },
        respondent: { connect: { id: respondent.id } },
        answers: data.answers,
      },
    });
  }
}
