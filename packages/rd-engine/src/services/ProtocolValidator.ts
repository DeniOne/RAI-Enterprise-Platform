import { Protocol, Trial, Measurement } from '@rai/prisma-client';

export interface ValidationResult {
    isValid: boolean;
    deviations: string[];
}

export class ProtocolValidator {
    /**
     * Проверка триала на соответствие протоколу по наличию обязательных переменных 
     * и соблюдению условий.
     */
    validateTrial(trial: Trial & { measurements: Measurement[] }, protocol: Protocol): ValidationResult {
        const deviations: string[] = [];

        // 1. Проверяем наличие обязательных переменных из протокола
        // Предполагаем, что protocol.variables хранит массив названий обязательных штук
        const requiredVariables = (protocol.variables as any)?.required || [];
        const measuredVariables = new Set(trial.measurements.map((m: Measurement) => m.variable));

        for (const variable of requiredVariables) {
            if (!measuredVariables.has(variable)) {
                deviations.push(`Missing mandatory measurement: ${variable}`);
            }
        }

        // 2. Проверка зафиксированных отклонений в триале
        if (trial.deviations) {
            deviations.push(`Manual deviation recorded: ${trial.deviations}`);
        }

        return {
            isValid: deviations.length === 0,
            deviations
        };
    }
}
