import { mapLegacyWidgetsToWorkWindows } from "./legacy-widget-window.mapper";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "../../../shared/rai-chat/rai-chat-widgets.types";

describe("legacy-widget-window.mapper", () => {
  it("maps short deviation list to related_signals", () => {
    const windows = mapLegacyWidgetsToWorkWindows({
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
                severity: "high",
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

    expect(windows).toEqual([
      expect.objectContaining({
        type: "related_signals",
        category: "signals",
        mode: "inline",
      }),
    ]);
  });

  it("maps task backlog to structured_result", () => {
    const windows = mapLegacyWidgetsToWorkWindows({
      widgets: [
        {
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.TaskBacklog,
          version: 1,
          payload: {
            title: "Задачи",
            items: [
              {
                id: "task-1",
                title: "Проверить KPI",
                dueLabel: "Сегодня",
                ownerLabel: "Экономист-А",
                status: "queued",
              },
            ],
          },
        },
      ],
      baseWindowId: "win-legacy",
      agentRole: "economist",
    });

    expect(windows).toEqual([
      expect.objectContaining({
        type: "structured_result",
        category: "result",
        payload: expect.objectContaining({
          sections: expect.arrayContaining([
            expect.objectContaining({
              title: "Задачи",
            }),
          ]),
        }),
      }),
    ]);
  });
});
