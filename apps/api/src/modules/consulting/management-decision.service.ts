import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { DecisionStatus, UserRole } from "@rai/prisma-client";

export interface UserContext {
  userId: string;
  role: UserRole;
  companyId: string;
}

@Injectable()
export class ManagementDecisionService {
  private readonly logger = new Logger(ManagementDecisionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создает черновик решения. isActive = null для черновиков, чтобы не блокировать уникальность.
   */
  async createDraft(
    deviationId: string,
    description: string,
    expectedEffect: string,
    context: UserContext,
  ) {
    const deviation = await this.prisma.deviationReview.findFirst({
      where: { id: deviationId, companyId: context.companyId },
    });

    if (!deviation) {
      throw new NotFoundException("Отклонение не найдено");
    }

    return this.prisma.managementDecision.create({
      data: {
        deviationId,
        description,
        expectedEffect,
        status: DecisionStatus.DRAFT,
        version: 1,
        authorId: context.userId,
        isActive: null, // Drafts are not active until confirmed
      }, // tenant-lint:ignore tenant is validated by deviation.companyId check above
    });
  }

  /**
   * Подтверждает решение. Реализовано как атомарная смена активной версии.
   * Генерирует хеш для обеспечения tamper-evidence.
   */
  async confirm(decisionId: string, context: UserContext) {
    const decision = await this.prisma.managementDecision.findFirst({
      where: { id: decisionId, deviation: { companyId: context.companyId } },
      include: { deviation: true },
    });

    if (!decision) {
      throw new NotFoundException("Решение не найдено");
    }

    if (decision.status !== DecisionStatus.DRAFT) {
      throw new ForbiddenException("Подтвердить можно только черновик");
    }

    //payload для хеширования (Tamper Detection)
    const payload = {
      id: decision.id,
      deviationId: decision.deviationId,
      version: decision.version, // Phase 3 Hardening
      description: decision.description,
      expectedEffect: decision.expectedEffect,
      authorId: decision.authorId,
      timestamp: new Date().toISOString(),
    };
    const decisionHash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");

    return this.prisma.$transaction(async (tx) => {
      // 1. Деактивируем все предыдущие подтвержденные решения для этого отклонения (Defense in Depth)
      await tx.managementDecision.updateMany({
        where: {
          deviationId: decision.deviationId,
          isActive: true,
          deviation: { companyId: context.companyId },
        },
        data: { isActive: null },
      });

      // 2. Подтверждаем текущее
      const confirmResult = await tx.managementDecision.updateMany({
        where: {
          id: decisionId,
          version: decision.version,
          status: DecisionStatus.DRAFT,
          deviation: { companyId: context.companyId },
        },
        data: {
          status: DecisionStatus.CONFIRMED,
          confirmedAt: new Date(),
          isActive: true,
          decisionHash,
        },
      });
      if (confirmResult.count !== 1) {
        throw new ConflictException("Decision confirmation conflict");
      }
      const confirmed = await tx.managementDecision.findFirstOrThrow({
        where: { id: decisionId, deviation: { companyId: context.companyId } },
      });

      this.logger.log(
        `[MANAGEMENT] Decision ${decisionId} CONFIRMED. Hash: ${decisionHash.substring(0, 8)}`,
      );
      return confirmed;
    });
  }

  /**
   * Заменяет решение. Старое решение de-facto становится историческим (isActive=null).
   */
  async supersede(
    oldDecisionId: string,
    newDescription: string,
    newExpectedEffect: string,
    context: UserContext,
  ) {
    const oldDecision = await this.prisma.managementDecision.findFirst({
      where: { id: oldDecisionId, deviation: { companyId: context.companyId } },
      include: { deviation: true },
    });

    if (!oldDecision) {
      throw new NotFoundException("Исходное решение не найдено");
    }

    if (oldDecision.status !== DecisionStatus.CONFIRMED) {
      throw new ForbiddenException(
        "Заменить можно только подтвержденное решение",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Снимаем флаг активности со старого решения
      const superseded = await tx.managementDecision.updateMany({
        where: {
          id: oldDecisionId,
          version: oldDecision.version,
          status: DecisionStatus.CONFIRMED,
          deviation: { companyId: context.companyId },
        },
        data: {
          status: DecisionStatus.SUPERSEDED,
          isActive: null,
        },
      });
      if (superseded.count !== 1) {
        throw new ConflictException("Decision supersede conflict");
      }

      // 2. Создаем черновик новой версии
      return tx.managementDecision.create({
        // tenant-lint:ignore tenant is inherited from validated oldDecision.deviation relation
        data: {
          deviationId: oldDecision.deviationId,
          version: oldDecision.version + 1,
          supersedesId: oldDecisionId,
          description: newDescription,
          expectedEffect: newExpectedEffect,
          status: DecisionStatus.DRAFT,
          authorId: context.userId,
          isActive: null,
        }, // tenant-lint:ignore tenant inherited from oldDecision.deviationId validated above
      });
    });
  }

  async getDecisionHistory(decisionId: string, context: UserContext) {
    const decision = await this.prisma.managementDecision.findFirst({
      where: { id: decisionId, deviation: { companyId: context.companyId } },
      include: { deviation: true },
    });

    if (!decision) {
      throw new NotFoundException("Решение не найдено");
    }

    return this.prisma.managementDecision.findMany({
      where: {
        deviationId: decision.deviationId,
        deviation: { companyId: context.companyId },
      },
      orderBy: { version: "desc" },
      include: { author: { select: { name: true, email: true } } },
    });
  }
}
