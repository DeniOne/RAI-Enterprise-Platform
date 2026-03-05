import { Test, TestingModule } from "@nestjs/testing";
import { ResponseComposerService } from "./response-composer.service";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";

describe("ResponseComposerService", () => {
  let service: ResponseComposerService;
  const widgetBuilderMock = { build: jest.fn().mockReturnValue([]) };
  const sensitiveDataFilterMock = { mask: jest.fn((s: string) => s) };

  beforeEach(async () => {
    jest.clearAllMocks();
    sensitiveDataFilterMock.mask.mockImplementation((s: string) => s);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseComposerService,
        { provide: RaiChatWidgetBuilder, useValue: widgetBuilderMock },
        { provide: SensitiveDataFilterService, useValue: sensitiveDataFilterMock },
      ],
    }).compile();
    service = module.get(ResponseComposerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("buildSuggestedActions returns echo and workspace snapshot when route present", () => {
    const actions = service.buildSuggestedActions({
      message: "hi",
      workspaceContext: { route: "/dashboard" },
    });
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[0].toolName).toBe("echo_message");
  });
});
