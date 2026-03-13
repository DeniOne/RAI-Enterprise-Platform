/**
 * Выбрасывается, когда RiskPolicy запретил выполнение тула и создан PendingAction.
 * Вместо вызова хэндлера возвращается эта ошибка; верхний слой формирует ответ агенту.
 */
export class RiskPolicyBlockedError extends Error {
  constructor(
    public readonly actionId: string,
    public readonly toolName: string,
    message?: string,
  ) {
    super(message ?? `RiskPolicy: выполнение инструмента ${toolName} заблокировано. Создан PendingAction #${actionId}. Ожидается подтверждение человека.`);
    this.name = "RiskPolicyBlockedError";
    Object.setPrototypeOf(this, RiskPolicyBlockedError.prototype);
  }
}
