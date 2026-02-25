export interface RdStrategicState {
  activeExperiments: number;
  protocolViolations: number;
  coherence: number;
}

export interface LegalStrategicState {
  activeViolations: number;
  pendingValidations: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface StrategicState {
  asOf: Date;
  overall: "OK" | "ATTENTION" | "CRITICAL";
  source: string[];
  rd: RdStrategicState;
  legal: LegalStrategicState;
  // Frontend Compatibility Layer
  constraints: {
    legal: number;
    rnd: number;
    ops: number;
  };
  escalations: any[]; // Define a stricter type if possible, but 'any' allows flexibility for now
  risk?: any; // B6: Risk Assessment
}
