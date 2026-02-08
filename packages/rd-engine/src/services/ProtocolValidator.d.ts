import { Protocol, Trial, Measurement } from '@rai/prisma-client';
export interface ValidationResult {
    isValid: boolean;
    deviations: string[];
}
export declare class ProtocolValidator {
    validateTrial(trial: Trial & {
        measurements: Measurement[];
    }, protocol: Protocol): ValidationResult;
}
