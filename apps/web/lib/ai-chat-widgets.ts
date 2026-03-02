export const RAI_CHAT_WIDGETS_SCHEMA_VERSION = "1.0" as const;

export enum RaiChatWidgetType {
  DeviationList = "deviation_list",
  TaskBacklog = "task_backlog",
}

export interface DeviationListWidget {
  schemaVersion: typeof RAI_CHAT_WIDGETS_SCHEMA_VERSION;
  type: RaiChatWidgetType.DeviationList;
  version: 1;
  payload: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      severity: "low" | "medium" | "high";
      fieldLabel: string;
      status: "open" | "watch";
    }>;
  };
}

export interface TaskBacklogWidget {
  schemaVersion: typeof RAI_CHAT_WIDGETS_SCHEMA_VERSION;
  type: RaiChatWidgetType.TaskBacklog;
  version: 1;
  payload: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      dueLabel: string;
      ownerLabel: string;
      status: "queued" | "in_progress";
    }>;
  };
}

export interface UnknownRaiChatWidget {
  schemaVersion: string;
  type: string;
  version: number;
  payload: Record<string, unknown>;
}

export type RaiChatWidget =
  | DeviationListWidget
  | TaskBacklogWidget
  | UnknownRaiChatWidget;
