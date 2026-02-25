import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import { TechMapStatus, UserRole } from "@rai/prisma-client";

/**
 * GovernanceContext — контекст для governance-критичных переходов.
 *
 * ИНВАРИАНТ I33:
 *   OVERRIDE_ANALYSIS → DRAFT запрещён без сохранённого DivergenceRecord.
 *   При high risk (DIS > 0.7) требуется justification.
 */
export interface GovernanceContext {
  /** ID записи DivergenceRecord. Обязателен для OVERRIDE_ANALYSIS → DRAFT. */
  divergenceRecordId?: string;
  /** DIS Score из ConflictMatrix. Если > 0.7 → требуется justification. */
  disScore?: number;
  /** Обоснование при high risk. Обязательно если DIS > 0.7. */
  justification?: string;
}

/**
 * DraftStateManager — FSM для генеративных черновиков.
 *
 * ПОЛНАЯ Transition Matrix (Контракт §4 + Level C I29–I33):
 *
 * | From               | To                 | Condition                      | Allowed |
 * |--------------------|--------------------|--------------------------------|---------|
 * | GENERATED_DRAFT    | DRAFT              | HUMAN_APPROVE (I17)            | ✔       |
 * | GENERATED_DRAFT    | ARCHIVED           | HUMAN_REJECT                   | ✔       |
 * | DRAFT              | OVERRIDE_ANALYSIS  | HUMAN (Level C, I29)           | ✔       |
 * | OVERRIDE_ANALYSIS  | DRAFT              | HUMAN + DivergenceRecord (I33) | ✔       |
 * | OVERRIDE_ANALYSIS  | ARCHIVED           | HUMAN_REJECT                   | ✔       |
 *
 * Governance Guards (I33):
 *   - OVERRIDE_ANALYSIS → DRAFT: divergenceRecordId обязателен
 *   - OVERRIDE_ANALYSIS → DRAFT при DIS > 0.7: justification обязателен
 *
 * Все остальные переходы — делегируются в основную TechMap FSM.
 */
@Injectable()
export class DraftStateManager {
  private readonly logger = new Logger(DraftStateManager.name);

  /** Порог DIS, выше которого требуется justification. */
  static readonly HIGH_RISK_DIS_THRESHOLD = 0.7;

  private static readonly HUMAN_ROLES: UserRole[] = [
    UserRole.ADMIN,
    UserRole.CEO,
    UserRole.MANAGER,
    UserRole.AGRONOMIST,
  ];

  /**
   * Полная Transition Matrix.
   * requiresDivergenceRecord = true → I33: DivergenceRecord обязателен.
   * requiresJustification = true → justification обязательна при DIS > 0.7.
   */
  private static readonly TRANSITION_MATRIX: Array<{
    from: TechMapStatus;
    to: TechMapStatus;
    requiresHuman: boolean;
    requiresDivergenceRecord: boolean;
    requiresJustification: boolean;
  }> = [
    // Level B: GENERATED_DRAFT transitions
    {
      from: TechMapStatus.GENERATED_DRAFT,
      to: TechMapStatus.DRAFT,
      requiresHuman: true,
      requiresDivergenceRecord: false,
      requiresJustification: false,
    },
    {
      from: TechMapStatus.GENERATED_DRAFT,
      to: TechMapStatus.ARCHIVED,
      requiresHuman: true,
      requiresDivergenceRecord: false,
      requiresJustification: false,
    },
    // Level C: OVERRIDE_ANALYSIS transitions (I29–I33)
    {
      from: TechMapStatus.DRAFT,
      to: TechMapStatus.OVERRIDE_ANALYSIS,
      requiresHuman: true,
      requiresDivergenceRecord: false,
      requiresJustification: false,
    },
    {
      from: TechMapStatus.OVERRIDE_ANALYSIS,
      to: TechMapStatus.DRAFT,
      requiresHuman: true,
      requiresDivergenceRecord: true, // I33: DivergenceRecord обязателен
      requiresJustification: true, // Justification при DIS > 0.7
    },
    {
      from: TechMapStatus.OVERRIDE_ANALYSIS,
      to: TechMapStatus.ARCHIVED,
      requiresHuman: true,
      requiresDivergenceRecord: false,
      requiresJustification: false,
    },
  ];

  /**
   * Проверяет допустимость перехода.
   * Используется explicit whitelist — всё что не перечислено запрещено.
   */
  canTransition(
    currentStatus: TechMapStatus,
    targetStatus: TechMapStatus,
    userRole: UserRole,
    governance?: GovernanceContext,
  ): boolean {
    if (!this.handlesStatus(currentStatus)) {
      return false;
    }

    const rule = DraftStateManager.TRANSITION_MATRIX.find(
      (r) => r.from === currentStatus && r.to === targetStatus,
    );

    if (!rule) {
      return false;
    }

    if (rule.requiresHuman && !DraftStateManager.isHuman(userRole)) {
      return false;
    }

    // I33: Governance Guard — DivergenceRecord обязателен
    if (rule.requiresDivergenceRecord) {
      if (!governance?.divergenceRecordId) {
        return false;
      }
    }

    // I33: High Risk Justification Guard
    if (rule.requiresJustification && governance?.disScore !== undefined) {
      if (governance.disScore > DraftStateManager.HIGH_RISK_DIS_THRESHOLD) {
        if (
          !governance.justification ||
          governance.justification.trim().length === 0
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Валидирует переход. Бросает ForbiddenException с точным описанием нарушения.
   */
  validate(
    currentStatus: TechMapStatus,
    targetStatus: TechMapStatus,
    userRole: UserRole,
    governance?: GovernanceContext,
  ): void {
    if (
      !this.canTransition(currentStatus, targetStatus, userRole, governance)
    ) {
      // Определяем причину отказа
      if (!this.handlesStatus(currentStatus)) {
        throw new ForbiddenException(
          `[FSM] DraftStateManager не обрабатывает статус ${currentStatus}. ` +
            `Используйте основной TechMap FSM.`,
        );
      }

      const rule = DraftStateManager.TRANSITION_MATRIX.find(
        (r) => r.from === currentStatus && r.to === targetStatus,
      );

      if (!rule) {
        const allowed = DraftStateManager.TRANSITION_MATRIX.filter(
          (r) => r.from === currentStatus,
        )
          .map((r) => r.to)
          .join(", ");

        throw new ForbiddenException(
          `[I17] FSM: ${currentStatus} → ${targetStatus} запрещён. ` +
            `Допустимые переходы: ${allowed}`,
        );
      }

      // Роль не подходит
      if (rule.requiresHuman && !DraftStateManager.isHuman(userRole)) {
        throw new ForbiddenException(
          `[I17] Human Override: роль ${userRole} не может выполнить ` +
            `${currentStatus} → ${targetStatus}. ` +
            `Допустимые роли: ${DraftStateManager.HUMAN_ROLES.join(", ")}`,
        );
      }

      // I33: DivergenceRecord отсутствует
      if (rule.requiresDivergenceRecord && !governance?.divergenceRecordId) {
        throw new ForbiddenException(
          `[I33] Governance Guard: переход ${currentStatus} → ${targetStatus} ` +
            `запрещён без сохранённого DivergenceRecord. ` +
            `Необходимо выполнить confirm-override и получить divergenceRecordId.`,
        );
      }

      // I33: High Risk без justification
      if (
        rule.requiresJustification &&
        governance?.disScore !== undefined &&
        governance.disScore > DraftStateManager.HIGH_RISK_DIS_THRESHOLD
      ) {
        throw new ForbiddenException(
          `[I33] Governance Guard: DIS=${governance.disScore.toFixed(4)} > ${DraftStateManager.HIGH_RISK_DIS_THRESHOLD}. ` +
            `При высоком уровне расхождения обязательна justification. ` +
            `Передайте обоснование перехода в GovernanceContext.justification.`,
        );
      }
    }

    this.logger.log(
      `[FSM] Переход: ${currentStatus} → ${targetStatus} (role=${userRole}` +
        `${governance?.divergenceRecordId ? `, divergence=${governance.divergenceRecordId}` : ""}` +
        `${governance?.disScore ? `, DIS=${governance.disScore}` : ""}) ✅`,
    );
  }

  /**
   * Возвращает все допустимые целевые статусы из текущего статуса.
   */
  getAvailableTransitions(
    currentStatus: TechMapStatus,
    userRole: UserRole,
  ): TechMapStatus[] {
    return DraftStateManager.TRANSITION_MATRIX.filter(
      (r) => r.from === currentStatus,
    )
      .filter((r) => !r.requiresHuman || DraftStateManager.isHuman(userRole))
      .map((r) => r.to);
  }

  /**
   * Проверяет, управляется ли данный статус этим FSM.
   * Level B: GENERATED_DRAFT
   * Level C: OVERRIDE_ANALYSIS, DRAFT (для перехода в OVERRIDE_ANALYSIS)
   */
  handlesStatus(status: TechMapStatus): boolean {
    return (
      status === TechMapStatus.GENERATED_DRAFT ||
      status === TechMapStatus.OVERRIDE_ANALYSIS ||
      status === TechMapStatus.DRAFT
    );
  }

  private static isHuman(role: UserRole): boolean {
    return DraftStateManager.HUMAN_ROLES.includes(role);
  }
}
