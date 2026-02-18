import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

/**
 * NormalizationEnforcer — Гарантия корректности распределений (I23).
 * 
 * Инвариант: Интеграл плотности вероятности должен быть равен 1.0.
 * Допуск: |sum(p) - 1.0| < 0.001 (для дискретных приближений).
 */
@Injectable()
export class NormalizationEnforcer {
    private readonly logger = new Logger(NormalizationEnforcer.name);
    private readonly TOLERANCE = 0.001;

    /**
     * Проверяет нормализацию дискретного распределения.
     * @param distribution - массив вероятностей или пар (значение, вероятность)
     */
    validateNormalization(probabilities: number[]): void {
        const sum = probabilities.reduce((acc, p) => acc + p, 0);

        if (Math.abs(sum - 1.0) > this.TOLERANCE) {
            throw new InternalServerErrorException(
                `[I23] Probability Normalization Violation: sum=${sum.toFixed(6)} != 1.0`,
            );
        }
    }

    /**
     * Нормализует распределение (если расхождение невелико).
     */
    normalize(probabilities: number[]): number[] {
        const sum = probabilities.reduce((acc, p) => acc + p, 0);
        if (sum === 0) throw new InternalServerErrorException('[I23] Cannot normalize zero-sum distribution');
        return probabilities.map(p => p / sum);
    }
}
