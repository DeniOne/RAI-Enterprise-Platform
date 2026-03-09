import { FrontOfficeAgent } from "./front-office-agent.service";
import { FrontOfficeToolsRegistry } from "../tools/front-office-tools.registry";

describe("FrontOfficeAgent", () => {
  const frontOfficeRegistryMock = {
    execute: jest.fn(),
  } as unknown as FrontOfficeToolsRegistry;

  let agent: FrontOfficeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new FrontOfficeAgent(frontOfficeRegistryMock);
  });

  it("classify_dialog_thread логирует сообщение и возвращает COMPLETED", async () => {
    (frontOfficeRegistryMock.execute as jest.Mock)
      .mockResolvedValueOnce({
        logged: true,
        auditLogId: "audit-1",
        threadKey: "company-1:web_chat:thread-1",
        channel: "web_chat",
        direction: "inbound",
      })
      .mockResolvedValueOnce({
        classification: "task_process",
        confidence: 0.82,
        reasons: ["task_language_detected"],
        targetOwnerRole: "crm_agent",
        needsEscalation: true,
        threadKey: "company-1:web_chat:thread-1",
      });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-1",
      intent: "classify_dialog_thread",
      channel: "web_chat",
      messageText: "Нужно завести клиента в CRM",
      threadExternalId: "thread-1",
    });

    expect(result.agentName).toBe("FrontOfficeAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.toolCallsCount).toBe(2);
    expect(result.explain).toContain("task_process");
  });

  it("create_front_office_escalation делает log, classify и escalation", async () => {
    (frontOfficeRegistryMock.execute as jest.Mock)
      .mockResolvedValueOnce({
        logged: true,
        auditLogId: "audit-1",
        threadKey: "company-1:telegram:tg-1",
        channel: "telegram",
        direction: "inbound",
      })
      .mockResolvedValueOnce({
        classification: "escalation_signal",
        confidence: 0.88,
        reasons: ["critical_signal_detected"],
        targetOwnerRole: "contracts_agent",
        needsEscalation: true,
        threadKey: "company-1:telegram:tg-1",
      })
      .mockResolvedValueOnce({
        created: true,
        auditLogId: "audit-2",
        classification: "escalation_signal",
        targetOwnerRole: "contracts_agent",
        summary: "handoff",
        threadKey: "company-1:telegram:tg-1",
      });

    const result = await agent.run({
      companyId: "company-1",
      traceId: "trace-2",
      intent: "create_front_office_escalation",
      channel: "telegram",
      messageText: "Срочно, договор завис",
      threadExternalId: "tg-1",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.toolCallsCount).toBe(3);
    expect(result.explain).toContain("Эскалация создана");
  });
});
