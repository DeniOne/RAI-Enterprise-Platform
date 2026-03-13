export class AgentConfigBlockedError extends Error {
  constructor(
    public readonly reasonCode: "AGENT_DISABLED" | "CAPABILITY_DENIED",
    public readonly toolName: string,
    message?: string,
  ) {
    super(message ?? `AgentConfig: выполнение инструмента ${toolName} заблокировано.`);
    this.name = "AgentConfigBlockedError";
    Object.setPrototypeOf(this, AgentConfigBlockedError.prototype);
  }
}
