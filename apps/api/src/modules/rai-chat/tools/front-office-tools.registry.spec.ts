import { FrontOfficeToolsRegistry } from "./front-office-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("FrontOfficeToolsRegistry", () => {
  const auditServiceMock = {
    log: jest.fn(),
  };

  let registry: FrontOfficeToolsRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    auditServiceMock.log.mockResolvedValue({ id: "audit-1" });
    registry = new FrontOfficeToolsRegistry(auditServiceMock as never);
    registry.onModuleInit();
  });

  it("log_dialog_message пишет audit trail", async () => {
    const result = await registry.execute(
      RaiToolName.LogDialogMessage,
      {
        channel: "telegram",
        direction: "inbound",
        messageText: "Клиент написал в Telegram",
        threadExternalId: "tg-1",
      },
      { companyId: "company-1", traceId: "trace-1", userId: "user-1" },
    );

    expect(result.logged).toBe(true);
    expect(result.threadKey).toBe("company-1:telegram:tg-1");
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "FRONT_OFFICE_DIALOG_MESSAGE_LOGGED",
        companyId: "company-1",
      }),
    );
  });

  it("classify_dialog_thread выделяет task_process и owner", async () => {
    const result = await registry.execute(
      RaiToolName.ClassifyDialogThread,
      {
        channel: "web_chat",
        messageText: "Нужно завести контрагента и передать в CRM",
        threadExternalId: "web-7",
      },
      { companyId: "company-1", traceId: "trace-2" },
    );

    expect(result.classification).toBe("task_process");
    expect(result.targetOwnerRole).toBe("crm_agent");
    expect(result.needsEscalation).toBe(true);
    expect(result.mustClarifications).toContain("LINK_FIELD_OR_TASK");
    expect(result.handoffSummary).toContain("classification=task_process");
  });

  it("create_front_office_escalation сохраняет escalation в audit", async () => {
    auditServiceMock.log.mockResolvedValueOnce({ id: "audit-escalation-1" });

    const result = await registry.execute(
      RaiToolName.CreateFrontOfficeEscalation,
      {
        channel: "telegram",
        messageText: "Срочно, договор завис и нужно вмешательство",
        threadExternalId: "tg-99",
      },
      { companyId: "company-1", traceId: "trace-3", userId: "user-1" },
    );

    expect(result.created).toBe(true);
    expect(result.classification).toBe("escalation_signal");
    expect(result.targetOwnerRole).toBe("contracts_agent");
    expect(auditServiceMock.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "FRONT_OFFICE_ESCALATION_CREATED",
      }),
    );
  });

  it("не трактует хозяйство-клиента как CRM lead по умолчанию", async () => {
    const result = await registry.execute(
      RaiToolName.ClassifyDialogThread,
      {
        channel: "telegram",
        messageText:
          "Есть вопрос по договору и условиям сопровождения по хозяйству South Field Farm на сезон 2026",
        threadExternalId: "tg-11",
      },
      { companyId: "company-1", traceId: "trace-4" },
    );

    expect(result.classification).toBe("client_request");
    expect(result.targetOwnerRole).toBe("contracts_agent");
    expect(result.targetOwnerRole).not.toBe("crm_agent");
    expect(result.handoffSummary).toContain("owner=contracts_agent");
  });
});
