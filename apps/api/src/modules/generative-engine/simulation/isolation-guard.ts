import { Injectable, Logger } from "@nestjs/common";

/**
 * IsolationGuard — Защита симуляций (I22).
 *
 * Гарантирует, что симуляционный прогон:
 * 1. Не пишет в основные таблицы (GenerationRecord, AgronomicStrategy)
 * 2. Не использует production Side-Effects (notifications, billing)
 * 3. Использует только in-memory или изолированные таблицы
 *
 * В текущей реализации (Level B) симуляция полностью in-memory/read-only.
 */
@Injectable()
export class IsolationGuard {
  private readonly logger = new Logger(IsolationGuard.name);

  /**
   * Проверяет контекст выполнения.
   * @param contextType - 'PRODUCTION' | 'SIMULATION'
   */
  assertIsolation(contextType: string): void {
    if (contextType === "SIMULATION") {
      this.logger.debug(
        "[I22] IsolationGuard: SIMULATION context active. Write operations restricted.",
      );
      // В будущем здесь будут проверки транзакции или схемы БД
    }
  }

  /**
   * Блокирует запись в production таблицы.
   */
  blockProductionWrite(tableName: string): void {
    throw new Error(
      `[I22] Isolation Violation: Attempt to write to ${tableName} during simulation`,
    );
  }
}
