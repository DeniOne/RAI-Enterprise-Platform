import {
  extractStructuredRuntimeSummary,
  resolveAgentExecutionSummary,
} from "./agent-execution-summary";

describe("agent-execution-summary", () => {
  it("берёт summary из structuredOutput, если prose отсутствует", () => {
    expect(
      resolveAgentExecutionSummary({
        structuredOutput: {
          summary: "Структурированное резюме.",
        },
      }),
    ).toBe("Структурированное резюме.");
  });

  it("берёт первый доступный summary из structuredOutputs", () => {
    expect(
      resolveAgentExecutionSummary({
        structuredOutputs: [
          {},
          { explanation: "Второй structured output объясняет результат." },
        ],
      }),
    ).toBe("Второй structured output объясняет результат.");
  });

  it("extractStructuredRuntimeSummary читает вложенный data.summary", () => {
    expect(
      extractStructuredRuntimeSummary({
        data: {
          summary: "Вложенное резюме.",
        },
      }),
    ).toBe("Вложенное резюме.");
  });
});
