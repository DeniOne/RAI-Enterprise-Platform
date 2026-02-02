// f:\RAI_EP\packages\agro-orchestrator\src\types.ts

export interface CanonicalStage {
  id: string; // e.g. "SOIL_PREP"
  order: number; // e.g. 1, 2, 3... Sort key.
  domain: string; // "RAPESEED" | "WHEAT" | "UNIVERSAL"
  name: string; // Human readable name (Russian mostly)
  description?: string;
}

export type ValidationStatus = 'OK' | 'BLOCK' | 'WARN';

export interface ValidationResult {
  status: ValidationStatus;
  ruleId?: string;
  reason?: string; // Explainability text
  data?: any; // Additional context about the failure
}

export interface AgroContext {
  fieldId: string;
  cropCycleId: string;
  currentStageId: string | null; // null if not started
  inputData: Record<string, any>; // Facts for the rule engine (soil moisture, etc)
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
