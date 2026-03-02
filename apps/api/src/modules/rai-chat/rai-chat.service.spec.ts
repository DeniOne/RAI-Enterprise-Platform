import { Test, TestingModule } from "@nestjs/testing";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { RaiToolName } from "./tools/rai-tools.types";

describe("RaiChatService", () => {
  let service: RaiChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RaiChatService, RaiToolsRegistry],
    }).compile();

    service = module.get(RaiChatService);
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("returns typed suggested actions and tool execution results", async () => {
    const result = await service.handleChat(
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
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: RaiToolName.EchoMessage,
        }),
        expect.objectContaining({
          toolName: RaiToolName.WorkspaceSnapshot,
        }),
      ]),
    );

    expect(result.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "ToolExecutionResults",
        }),
      ]),
    );
  });
});
