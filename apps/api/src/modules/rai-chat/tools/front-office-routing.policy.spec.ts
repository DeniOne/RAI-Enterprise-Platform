import {
  classifyFrontOfficeMessageByPolicy,
  detectTargetOwnerRoleByPolicy,
} from "../../../shared/rai-chat/front-office-routing.policy";

describe("front-office routing policy", () => {
  it("prefers contracts owner for contract-heavy request with farm wording", () => {
    const owner = detectTargetOwnerRoleByPolicy(
      "Есть вопрос по договору сопровождения по хозяйству South Field Farm",
    );

    expect(owner.role).toBe("contracts_agent");

    const classified = classifyFrontOfficeMessageByPolicy(
      "Есть вопрос по договору сопровождения по хозяйству South Field Farm",
    );
    expect(classified.classification).toBe("client_request");
    expect(classified.targetOwnerRole).toBe("contracts_agent");
  });

  it("routes CRM-intent to crm_agent", () => {
    const classified = classifyFrontOfficeMessageByPolicy(
      "Нужно завести контрагента и обновить реквизиты в CRM",
    );

    expect(classified.classification).toBe("task_process");
    expect(classified.targetOwnerRole).toBe("crm_agent");
    expect(classified.needsEscalation).toBe(true);
  });

  it("routes critical signal to escalation with monitoring fallback owner", () => {
    const classified = classifyFrontOfficeMessageByPolicy(
      "Срочно, не работает интеграция и система зависла",
    );

    expect(classified.classification).toBe("escalation_signal");
    expect(classified.targetOwnerRole).toBe("monitoring");
    expect(classified.needsEscalation).toBe(true);
  });

  it("keeps free-chat as non-escalation when no process signal", () => {
    const classified = classifyFrontOfficeMessageByPolicy(
      "Спасибо, хорошего дня",
    );

    expect(classified.classification).toBe("free_chat");
    expect(classified.needsEscalation).toBe(false);
  });
});

