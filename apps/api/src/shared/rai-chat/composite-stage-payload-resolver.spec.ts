import { resolveCompositeStagePayload } from "./composite-stage-payload-resolver";
import type { CompositeWorkflowStageContract } from "./composite-orchestration.types";
import { RaiToolName } from "./rai-tools.types";

describe("composite-stage-payload-resolver", () => {
  it("собирает payload из upstream стадий и поддерживает fallback через set_if_absent", () => {
    const stage: CompositeWorkflowStageContract = {
      stageId: "review_account_workspace",
      order: 3,
      agentRole: "crm_agent",
      intent: "review_account_workspace",
      toolName: RaiToolName.GetCrmAccountWorkspace,
      payload: {
        scope: {
          route: "/parties",
        },
      },
      payloadBindings: [
        {
          sourceStageId: "create_crm_account",
          sourcePath: "data.accountId",
          targetPath: "accountId",
          required: true,
        },
        {
          sourceStageId: "create_crm_account",
          sourcePath: "data.name",
          targetPath: "query",
          writeMode: "set_if_absent",
          required: false,
        },
        {
          sourceStageId: "register_counterparty",
          sourcePath: "data.legalName",
          targetPath: "query",
          writeMode: "set_if_absent",
          required: false,
        },
      ],
      label: "Открытие карточки",
      dependsOn: ["create_crm_account"],
      status: "planned",
    };

    const result = resolveCompositeStagePayload({
      stage,
      artifactsByStageId: new Map([
        [
          "register_counterparty",
          {
            structuredOutput: {
              data: {
                legalName: "ООО Ромашка",
              },
            },
          },
        ],
        [
          "create_crm_account",
          {
            structuredOutput: {
              data: {
                accountId: "acc-1",
                name: "ООО Ромашка",
              },
            },
          },
        ],
      ]),
    });

    expect(result).toEqual({
      ok: true,
      payload: {
        accountId: "acc-1",
        query: "ООО Ромашка",
        scope: {
          route: "/parties",
        },
      },
      missingRequiredBindings: [],
    });
  });

  it("возвращает missingRequiredBindings, если обязательные данные не были разрешены", () => {
    const stage: CompositeWorkflowStageContract = {
      stageId: "create_crm_account",
      order: 2,
      agentRole: "crm_agent",
      intent: "create_crm_account",
      toolName: RaiToolName.CreateCrmAccount,
      payloadBindings: [
        {
          sourceStageId: "register_counterparty",
          sourcePath: "data.partyId",
          targetPath: "partyId",
          required: true,
        },
      ],
      label: "Создание аккаунта",
      dependsOn: ["register_counterparty"],
      status: "planned",
    };

    const result = resolveCompositeStagePayload({
      stage,
      artifactsByStageId: new Map([
        [
          "register_counterparty",
          {
            structuredOutput: {
              data: {},
            },
          },
        ],
      ]),
    });

    expect(result.ok).toBe(false);
    expect(result.payload).toEqual({});
    expect(result.missingRequiredBindings).toEqual([
      "register_counterparty:data.partyId->partyId",
    ]);
  });
});
