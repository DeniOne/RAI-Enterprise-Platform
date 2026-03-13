import { RaiWorkWindowDto } from "../dto/rai-chat.dto";
import { RaiChatWidget } from "../../../shared/rai-chat/rai-chat-widgets.types";
import { mapLegacyWidgetsToWorkWindows } from "./legacy-widget-window.mapper";

const modeWeight: Record<RaiWorkWindowDto["mode"], number> = {
  takeover: 3,
  panel: 2,
  inline: 1,
};

const categoryWeight: Record<RaiWorkWindowDto["category"], number> = {
  clarification: 4,
  analysis: 3,
  result: 2,
  signals: 1,
};

export function resolveActiveWorkWindowId(
  windows: RaiWorkWindowDto[],
): string | null {
  if (windows.length === 0) {
    return null;
  }

  return [...windows]
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      if (modeWeight[right.mode] !== modeWeight[left.mode]) {
        return modeWeight[right.mode] - modeWeight[left.mode];
      }

      return categoryWeight[right.category] - categoryWeight[left.category];
    })[0]?.windowId ?? null;
}

export function composeWindowsFromLegacyWidgets(params: {
  widgets: RaiChatWidget[];
  baseWindowId: string;
  originMessageId?: string | null;
  agentRole?: string;
  summary?: string;
}): { workWindows: RaiWorkWindowDto[]; activeWindowId: string | null } {
  const workWindows = mapLegacyWidgetsToWorkWindows(params);

  return {
    activeWindowId: resolveActiveWorkWindowId(workWindows),
    workWindows,
  };
}
