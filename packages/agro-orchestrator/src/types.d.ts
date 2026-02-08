export interface CanonicalStage {
    id: string;
    order: number;
    domain: string;
    name: string;
    description?: string;
}
export type ValidationStatus = 'OK' | 'BLOCK' | 'WARN';
export interface ValidationResult {
    status: ValidationStatus;
    ruleId?: string;
    reason?: string;
    data?: any;
}
export interface AgroContext {
    fieldId: string;
    cropCycleId: string;
    currentStageId: string | null;
    inputData: Record<string, any>;
}
export interface TransitionRequest {
    targetStageId: string;
    context: AgroContext;
    dryRun?: boolean;
}
export interface TransitionResult {
    success: boolean;
    fromStageId: string | null;
    toStageId: string;
    validation: ValidationResult;
    dryRun: boolean;
}
