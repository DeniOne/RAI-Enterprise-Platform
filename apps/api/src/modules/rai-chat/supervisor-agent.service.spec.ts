import { Test, TestingModule } from "@nestjs/testing";
import { SupervisorAgent } from "./supervisor-agent.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { RaiToolName } from "./tools/rai-tools.types";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";

describe("SupervisorAgent", () => {
  let agent: SupervisorAgent;
  const memoryAdapterMock = {
    retrieve: jest.fn().mockResolvedValue({ items: [] }),
    appendInteraction: jest.fn().mockResolvedValue(undefined),
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
  const externalSignalsServiceMock = {
    process: jest
      .fn()
      .mockResolvedValue({ advisory: undefined, feedbackStored: false }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupervisorAgent,
        RaiToolsRegistry,
        RaiChatWidgetBuilder,
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
      ],
    }).compile();

    agent = module.get(SupervisorAgent);
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("orchestrates response contract through the supervisor layer", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/registry/fields",
      lastMessagePreview: "Покажи контекст",
      confidence: 0.82,
      provenance: "profile",
    });

    const result = await agent.orchestrate(
      {
        message: "Покажи контекст",
        workspaceContext: {
          route: "/registry/fields",
          lastUserAction: "open-field",
        },
        toolCalls: [
          {
            name: RaiToolName.WorkspaceSnapshot,
            payload: {
              route: "/registry/fields",
              lastUserAction: "open-field",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toolName: RaiToolName.EchoMessage }),
        expect.objectContaining({ toolName: RaiToolName.WorkspaceSnapshot }),
      ]),
    );
    expect(result.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.DeviationList,
        }),
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.TaskBacklog,
        }),
      ]),
    );
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          confidence: 0.82,
        }),
      ]),
    );
    expect(memoryAdapterMock.getProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
    );
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        userMessage: "Покажи контекст",
      }),
    );
    expect(memoryAdapterMock.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        lastRoute: "/registry/fields",
      }),
    );
  });

  it("includes profile summary in response when profile exists", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/consulting/dashboard",
      lastMessagePreview: "Покажи KPI",
    });

    const result = await agent.orchestrate(
      {
        message: "Что дальше?",
      },
      "company-2",
      "user-2",
    );

    expect(result.text).toContain(
      "(Профиль: lastRoute=/consulting/dashboard; lastMessage=Покажи KPI)",
    );
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          label: "lastRoute=/consulting/dashboard; lastMessage=Покажи KPI",
        }),
      ]),
    );
  });
});
