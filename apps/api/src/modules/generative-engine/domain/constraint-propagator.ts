import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { GeneratedDraft, StrategyConstraint, GenerationParams } from './draft-factory';

/**
 * ConstraintPropagator — Распространение ограничений стратегии.
 * 
 * ИНВАРИАНТ I21 (Constraint Propagation):
 * Ограничения из AgronomicStrategy наследуются в GeneratedDraft.
 * Ни одно ограничение не может быть потеряно или ослаблено.
 */
@Injectable()
export class ConstraintPropagator {
    private readonly logger = new Logger(ConstraintPropagator.name);

    /**
     * Распространяет ограничения стратегии в черновик (I21).
     * 
     * @param draft - генеративный черновик
     * @param constraints - ограничения из стратегии
     * @returns draft с заполненным propagatedConstraints
     * @throws BadRequestException если draft нарушает ограничения
     */
    propagate(
        draft: GeneratedDraft,
        constraints: StrategyConstraint[],
    ): GeneratedDraft {
        this.logger.log(
            `[I21] Распространение ${constraints.length} ограничений в черновик`,
        );

        // Копируем ограничения в черновик (без мутации оригинала)
        const propagatedDraft: GeneratedDraft = {
            ...draft,
            propagatedConstraints: [...constraints],
        };

        // Валидируем каждое ограничение
        const violations: string[] = [];

        for (const constraint of constraints) {
            const isValid = this.validateConstraint(propagatedDraft, constraint);
            if (!isValid) {
                violations.push(
                    `[${constraint.type}] ${constraint.field}: ${constraint.message}`,
                );
            }
        }

        if (violations.length > 0) {
            this.logger.warn(
                `[I21] Нарушения ограничений: ${violations.join('; ')}`,
            );
            throw new BadRequestException(
                `[I21] Constraint Propagation: черновик нарушает ${violations.length} ` +
                `ограничений стратегии:\n${violations.join('\n')}`,
            );
        }

        this.logger.log(
            `[I21] Все ${constraints.length} ограничений распространены успешно`,
        );

        return propagatedDraft;
    }

    /**
     * Валидирует одно ограничение относительно черновика.
     */
    private validateConstraint(
        draft: GeneratedDraft,
        constraint: StrategyConstraint,
    ): boolean {
        const value = this.extractFieldValue(draft, constraint.field);

        // Если поле не найдено — ограничение не проверяемо (OK по умолчанию)
        if (value === undefined) {
            return true;
        }

        switch (constraint.operator) {
            case 'EQ':
                return value === constraint.value;
            case 'LT':
                return (value as number) < (constraint.value as number);
            case 'GT':
                return (value as number) > (constraint.value as number);
            case 'LTE':
                return (value as number) <= (constraint.value as number);
            case 'GTE':
                return (value as number) >= (constraint.value as number);
            case 'IN':
                return (constraint.value as unknown[]).includes(value);
            case 'NOT_IN':
                return !(constraint.value as unknown[]).includes(value);
            default:
                this.logger.warn(
                    `[I21] Неизвестный оператор ограничения: ${constraint.operator}`,
                );
                return true;
        }
    }

    /**
     * Извлекает значение поля из черновика по dot-notation пути.
     */
    private extractFieldValue(
        draft: GeneratedDraft,
        fieldPath: string,
    ): unknown {
        const parts = fieldPath.split('.');
        let current: unknown = draft;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            current = (current as Record<string, unknown>)[part];
        }

        return current;
    }

    /**
     * Подсчитывает количество конфликтов.
     * Полезно для предварительной проверки без throw.
     */
    countViolations(
        draft: GeneratedDraft,
        constraints: StrategyConstraint[],
    ): number {
        let violations = 0;
        for (const constraint of constraints) {
            if (!this.validateConstraint(draft, constraint)) {
                violations++;
            }
        }
        return violations;
    }
}
