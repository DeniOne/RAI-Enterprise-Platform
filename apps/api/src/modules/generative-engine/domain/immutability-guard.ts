import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { StrategyStatus } from "@rai/prisma-client";

/**
 * ImmutabilityGuard — Защита от мутации PUBLISHED-стратегий.
 *
 * ИНВАРИАНТ I18 (Strategy Immutability):
 * PUBLISHED стратегия НЕЛЬЗЯ изменять. Только soft-archive.
 * DB-триггер trg_strategy_immutable — hard enforcement.
 * Этот guard — soft enforcement (application-level).
 *
 * Политика:
 * - DRAFT → PUBLISHED: разрешено
 * - PUBLISHED → ARCHIVED: единственная допустимая мутация (soft-archive)
 * - PUBLISHED → *: ЗАПРЕЩЕНО
 * - ARCHIVED → *: ЗАПРЕЩЕНО
 * - DELETE: ЗАПРЕЩЕНО (soft-archive only)
 */
@Injectable()
export class ImmutabilityGuard {
  private readonly logger = new Logger(ImmutabilityGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Проверяет, можно ли изменить стратегию (I18).
   * @throws ForbiddenException если стратегия immutable
   */
  async assertMutable(strategyId: string): Promise<void> {
    const strategy = await this.prisma.agronomicStrategy.findUnique({
      where: { id: strategyId },
      select: { status: true },
    });

    if (!strategy) {
      throw new ForbiddenException(`Стратегия ${strategyId} не найдена`);
    }

    if (strategy.status === StrategyStatus.PUBLISHED) {
      throw new ForbiddenException(
        `[I18] Стратегия ${strategyId} имеет статус PUBLISHED и неизменяема. ` +
          `Допускается только soft-archive (PUBLISHED → ARCHIVED).`,
      );
    }

    if (strategy.status === StrategyStatus.ARCHIVED) {
      throw new ForbiddenException(
        `[I18] Стратегия ${strategyId} архивирована и неизменяема.`,
      );
    }
  }

  /**
   * Архивирование PUBLISHED-стратегии (единственная допустимая мутация).
   */
  async softArchive(strategyId: string): Promise<void> {
    const strategy = await this.prisma.agronomicStrategy.findUnique({
      where: { id: strategyId },
      select: { status: true },
    });

    if (!strategy) {
      throw new ForbiddenException(`Стратегия ${strategyId} не найдена`);
    }

    if (strategy.status !== StrategyStatus.PUBLISHED) {
      throw new ForbiddenException(
        `[I18] Soft-archive допускается только для PUBLISHED стратегий. ` +
          `Текущий статус: ${strategy.status}`,
      );
    }

    await this.prisma.agronomicStrategy.update({
      where: { id: strategyId },
      data: {
        status: StrategyStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    this.logger.log(
      `[I18] Стратегия ${strategyId} архивирована (soft-archive)`,
    );
  }

  /**
   * Публикация DRAFT-стратегии (DRAFT → PUBLISHED).
   */
  async publish(strategyId: string): Promise<void> {
    const strategy = await this.prisma.agronomicStrategy.findUnique({
      where: { id: strategyId },
      select: { status: true },
    });

    if (!strategy) {
      throw new ForbiddenException(`Стратегия ${strategyId} не найдена`);
    }

    if (strategy.status !== StrategyStatus.DRAFT) {
      throw new ForbiddenException(
        `[I18] Публикация допускается только для DRAFT стратегий. ` +
          `Текущий статус: ${strategy.status}`,
      );
    }

    await this.prisma.agronomicStrategy.update({
      where: { id: strategyId },
      data: {
        status: StrategyStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    this.logger.log(`[I18] Стратегия ${strategyId} опубликована (PUBLISHED)`);
  }
}
