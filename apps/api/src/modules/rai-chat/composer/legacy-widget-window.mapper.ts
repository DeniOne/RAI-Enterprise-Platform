import { RaiChatWidget, RaiChatWidgetType } from "../widgets/rai-chat-widgets.types";
import { RaiWorkWindowDto } from "../dto/rai-chat.dto";

interface MapLegacyWidgetsParams {
  widgets: RaiChatWidget[];
  agentRole?: string;
  originMessageId?: string | null;
  baseWindowId: string;
  summary?: string;
}

function inferSignalTone(
  severity?: "low" | "medium" | "high",
): "critical" | "warning" | "info" {
  if (severity === "high") {
    return "critical";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "info";
}

export function mapLegacyWidgetsToWorkWindows(
  params: MapLegacyWidgetsParams,
): RaiWorkWindowDto[] {
  const { widgets, agentRole = "knowledge", originMessageId = null, baseWindowId, summary } =
    params;

  return widgets.map((widget, index) => {
    const windowId = `${baseWindowId}-${index + 1}`;
    const defaultPayload = {
      intentId: "compute_plan_fact" as const,
      summary: summary ?? "Структурный вывод агента.",
      missingKeys: [],
    };

    if (widget.type === RaiChatWidgetType.DeviationList) {
      const signalItems = widget.payload.items.map((item) => ({
        id: item.id,
        tone: inferSignalTone(item.severity),
        text: `${item.title} (${item.fieldLabel})`,
      }));

      if (widget.payload.items.length <= 3) {
        return {
          windowId,
          originMessageId,
          agentRole,
          type: "related_signals",
          parentWindowId: null,
          relatedWindowIds: [],
          category: "signals",
          priority: 45,
          mode: "inline",
          title: widget.payload.title,
          status: "informational",
          payload: {
            ...defaultPayload,
            summary: widget.payload.title,
            signalItems,
          },
          actions: [],
          isPinned: false,
        };
      }

      return {
        windowId,
        originMessageId,
        agentRole,
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [],
        category: "analysis",
        priority: 55,
        mode: "panel",
        title: widget.payload.title,
        status: "completed",
        payload: {
          ...defaultPayload,
          summary: widget.payload.title,
          sections: [
            {
              id: `${windowId}-section`,
              title: "Отклонения",
              items: widget.payload.items.map((item) => ({
                label: item.title,
                value: `${item.fieldLabel} • важность: ${item.severity} • статус: ${item.status}`,
                tone:
                  item.severity === "high"
                    ? "critical"
                    : item.severity === "medium"
                      ? "warning"
                      : "neutral",
              })),
            },
          ],
        },
        actions: [],
        isPinned: false,
      };
    }

    if (widget.type === RaiChatWidgetType.TaskBacklog) {
      return {
        windowId,
        originMessageId,
        agentRole,
        type: "structured_result",
        parentWindowId: null,
        relatedWindowIds: [],
        category: "result",
        priority: 50,
        mode: "panel",
        title: widget.payload.title,
        status: "completed",
        payload: {
          ...defaultPayload,
          summary: widget.payload.title,
          sections: [
            {
              id: `${windowId}-section`,
              title: "Задачи",
              items: widget.payload.items.map((item) => ({
                label: item.title,
                value: `${item.ownerLabel} • ${item.dueLabel} • статус: ${item.status}`,
                tone: item.status === "in_progress" ? "warning" : "neutral",
              })),
            },
          ],
        },
        actions: [],
        isPinned: false,
      };
    }

    return {
      windowId,
      originMessageId,
      agentRole,
      type: "structured_result",
      parentWindowId: null,
      relatedWindowIds: [],
      category: "result",
      priority: 40,
      mode: "panel",
      title: "Структурный вывод",
      status: "informational",
      payload: {
        ...defaultPayload,
        summary: "Этот блок пока не поддерживается типизированным окном.",
        sections: [
          {
            id: `${windowId}-section`,
            title: "Служебная информация",
            items: [
              {
                label: "Тип блока",
                value: String((widget as { type?: string }).type ?? "unknown"),
                tone: "neutral",
              },
            ],
          },
        ],
      },
      actions: [],
      isPinned: false,
    };
  });
}
