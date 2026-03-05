/** Выбрасывается при попытке вызвать WRITE/CRITICAL инструмент из AutonomousExecutionContext. */
export class SecurityViolationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly riskLevel: string,
    message?: string,
  ) {
    super(
      message ??
        `SECURITY_VIOLATION: tool ${toolName} (riskLevel=${riskLevel}) not allowed in autonomous context`,
    );
    this.name = "SecurityViolationError";
    Object.setPrototypeOf(this, SecurityViolationError.prototype);
  }
}
