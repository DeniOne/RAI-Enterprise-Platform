/**
 * Результат детерминированного расчёта с объяснением (RAI_AI_SYSTEM_ARCHITECTURE §8).
 * LLM не считает — только передаёт параметры в фасад.
 */
export interface ExplainableResult<T> {
  value: T;
  formula: string;
  variables: Record<string, number>;
  unit: string;
  explanation: string;
}
