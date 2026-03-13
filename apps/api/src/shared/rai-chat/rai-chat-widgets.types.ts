export const RAI_CHAT_WIDGETS_SCHEMA_VERSION = "1.0" as const;

export enum RaiChatWidgetType {
  DeviationList = "deviation_list",
  TaskBacklog = "task_backlog",
}

export interface RaiChatWidgetBase<
  TType extends RaiChatWidgetType,
  TPayload extends Record<string, unknown>,
> {
  schemaVersion: typeof RAI_CHAT_WIDGETS_SCHEMA_VERSION;
  type: TType;
  version: 1;
  payload: TPayload;
}

export interface DeviationListItem {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  fieldLabel: string;
  status: "open" | "watch";
}

export interface TaskBacklogItem {
  id: string;
  title: string;
  dueLabel: string;
  ownerLabel: string;
  status: "queued" | "in_progress";
}

export type DeviationListWidget = RaiChatWidgetBase<
  RaiChatWidgetType.DeviationList,
  {
    title: string;
    items: DeviationListItem[];
  }
>;

export type TaskBacklogWidget = RaiChatWidgetBase<
  RaiChatWidgetType.TaskBacklog,
  {
    title: string;
    items: TaskBacklogItem[];
  }
>;

export type RaiChatWidget = DeviationListWidget | TaskBacklogWidget;
