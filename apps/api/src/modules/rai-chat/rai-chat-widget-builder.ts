import { Injectable } from "@nestjs/common";
import { WorkspaceContextDto } from "./dto/rai-chat.dto";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidget,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";

@Injectable()
export class RaiChatWidgetBuilder {
  build(params: {
    companyId: string;
    workspaceContext?: WorkspaceContextDto;
  }): RaiChatWidget[] {
    const route = params.workspaceContext?.route ?? "/unknown";
    const routeSegments = route.split("/").filter(Boolean);
    const routeSuffix = routeSegments.at(-1) ?? "workspace";
    const routeLabel = routeSegments.join(" / ") || "workspace";
    const companyMarker = params.companyId.slice(-4).toUpperCase();
    const selectionLabel =
      params.workspaceContext?.selectedRowSummary?.title ??
      params.workspaceContext?.lastUserAction ??
      "без выбранного объекта";

    return [
      {
        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
        type: RaiChatWidgetType.DeviationList,
        version: 1,
        payload: {
          title: `Отклонения по маршруту ${routeLabel}`,
          items: [
            {
              id: `dev-${companyMarker}-${routeSuffix}-1`,
              title: `Просадка выполнения в контуре ${routeSuffix}`,
              severity: route.includes("execution") ? "high" : "medium",
              fieldLabel: `Контекст: ${selectionLabel}`,
              status: "open",
            },
            {
              id: `dev-${companyMarker}-${routeSuffix}-2`,
              title: `Требуется проверка отклонений компании ${companyMarker}`,
              severity: route.includes("dashboard") ? "low" : "medium",
              fieldLabel: `Маршрут: ${route}`,
              status: "watch",
            },
          ],
        },
      },
      {
        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
        type: RaiChatWidgetType.TaskBacklog,
        version: 1,
        payload: {
          title: `Бэклог ${companyMarker} для ${routeLabel}`,
          items: [
            {
              id: `task-${companyMarker}-${routeSuffix}-1`,
              title: `Проверить контур ${routeSuffix}`,
              dueLabel: "Сегодня, 14:00",
              ownerLabel: `Компания ${companyMarker}`,
              status: "queued",
            },
            {
              id: `task-${companyMarker}-${routeSuffix}-2`,
              title: `Уточнить контекст: ${selectionLabel}`,
              dueLabel: "Сегодня, 16:30",
              ownerLabel: "RAI Chat",
              status: route.includes("execution") ? "in_progress" : "queued",
            },
          ],
        },
      },
    ];
  }
}
