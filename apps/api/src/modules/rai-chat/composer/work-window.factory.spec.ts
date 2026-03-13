import {
  composeWindowsFromLegacyWidgets,
  resolveActiveWorkWindowId,
} from "./work-window.factory";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "../../../shared/rai-chat/rai-chat-widgets.types";

describe("work-window.factory", () => {
  it("resolves active window by priority and mode", () => {
    expect(
      resolveActiveWorkWindowId([
        {
          windowId: "win-inline",
          originMessageId: null,
          agentRole: "knowledge",
          type: "related_signals",
          parentWindowId: null,
          relatedWindowIds: [],
          category: "signals",
          priority: 50,
          mode: "inline",
          title: "Сигналы",
          status: "informational",
          payload: {
            intentId: "compute_plan_fact",
            summary: "Signals",
            missingKeys: [],
          },
          actions: [],
          isPinned: false,
        },
        {
          windowId: "win-takeover",
          originMessageId: null,
          agentRole: "economist",
          type: "comparison",
          parentWindowId: null,
          relatedWindowIds: [],
          category: "analysis",
          priority: 50,
          mode: "takeover",
          title: "Сравнение",
          status: "completed",
          payload: {
            intentId: "compute_plan_fact",
            summary: "Comparison",
            missingKeys: [],
          },
          actions: [],
          isPinned: false,
        },
      ]),
    ).toBe("win-takeover");
  });

  it("composes windows from legacy widgets", () => {
    const payload = composeWindowsFromLegacyWidgets({
      widgets: [
        {
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.DeviationList,
          version: 1,
          payload: {
            title: "Отклонения",
            items: [
              {
                id: "dev-1",
                title: "Проверить поле",
                severity: "medium",
                fieldLabel: "Поле 1",
                status: "open",
              },
            ],
          },
        },
      ],
      baseWindowId: "win-legacy",
      agentRole: "agronomist",
    });

    expect(payload.activeWindowId).toBe("win-legacy-1");
    expect(payload.workWindows).toHaveLength(1);
    expect(payload.workWindows[0]).toEqual(
      expect.objectContaining({
        type: "related_signals",
      }),
    );
  });
});
