export interface Field {
  id: string;
  name: string;
  area: number;
  status: string;
  client?: { id: string; name: string };
}

export interface Task {
  id: string;
  name: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  plannedDate?: string;
}

export interface TechMap {
  id: string;
  name: string;
  status: string;
  version: number;
}

export interface OrchestratorEvent {
  id: string;
  type: string;
  timestamp: string;
  metadata: any;
}

export interface SeasonSummary {
  id: string;
  year: number;
  status: string;
  fieldId?: string;
}

export interface FrontOfficeThreadMessageDto {
  id: string;
  threadId: string;
  direction: "inbound" | "outbound";
  messageText: string;
  createdAt: string;
  kind?:
    | "client_message"
    | "manager_reply"
    | "auto_reply"
    | "clarification_request"
    | "handoff_receipt"
    | "system_event";
  authorType?: "farm_representative" | "back_office_operator" | "rai" | "system";
  deliveryStatus?: "RECEIVED" | "SENT" | "SKIPPED" | "FAILED";
  sourceMessageId?: string | null;
  chatId?: string | null;
  metadata?: Record<string, unknown> | null;
  evidence?: unknown[] | null;
}

export interface FrontOfficeThreadListItemDto {
  threadId: string;
  threadKey: string;
  farmAccountId?: string | null;
  farmNameSnapshot?: string | null;
  representativeTelegramId?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  lastMessageDirection?: "inbound" | "outbound" | null;
  currentHandoffStatus?: string | null;
  currentOwnerRole?: string | null;
  unreadCount: number;
  needsHumanAction: boolean;
}

export interface FrontOfficeManagerFarmInboxDto {
  farmAccountId: string;
  farmName: string;
  unreadCount: number;
  threadCount: number;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  lastHandoffStatus?: string | null;
  needsHumanAction: boolean;
}

export interface ManagerFarmAssignmentDto {
  id: string;
  userId: string;
  farmAccountId: string;
  status: string;
  priority: number;
  farmName?: string | null;
  userEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramWorkspaceBootstrapDto {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
    accountId?: string | null;
    employeeProfile?: { clientId?: string | null } | null;
  };
  telegramTunnel: "front_office_rep" | "back_office_operator";
  miniAppUrl: string;
}

const BASE_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
    : "/api";

async function fetchWithAuth(
  path: string,
  token?: string,
  options: RequestInit = {},
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Ошибка API (${response.status}) для ${path}`);
  }

  return response.json();
}

export const frontOfficeApi = {
  // Fields
  getFields: (token: string) => fetchWithAuth("/registry/fields", token),
  getField: (id: string, token: string) =>
    fetchWithAuth(`/registry/fields/${id}`, token),
  getOverview: (token: string) =>
    fetchWithAuth("/front-office/overview", token),
  getQueues: (token: string) => fetchWithAuth("/front-office/queues", token),

  // Tasks
  getMyTasks: (token: string) => fetchWithAuth("/tasks/my", token),
  getTask: (id: string, token: string) => fetchWithAuth(`/tasks/${id}`, token),
  updateTaskStatus: (id: string, status: string, token: string) =>
    fetchWithAuth(`/tasks/${id}/${status}`, token, { method: "POST" }),

  // Tech Maps
  getTechMaps: (token: string) => fetchWithAuth("/tech-map", token),
  getTechMapsBySeason: (seasonId: string, token: string) =>
    fetchWithAuth(`/tech-map/season/${seasonId}`, token),
  getTechMap: (id: string, token: string) =>
    fetchWithAuth(`/tech-map/${id}`, token),
  transitionTechMap: (id: string, status: string, token: string) =>
    fetchWithAuth(`/tech-map/${id}/transition`, token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Orchestrator
  getSeasons: (token: string) => fetchWithAuth("/seasons", token),
  getSeason: (id: string, token: string) =>
    fetchWithAuth(`/seasons/${id}`, token),
  getSeasonStage: (seasonId: string, token: string) =>
    fetchWithAuth(`/orchestrator/seasons/${seasonId}/stage`, token),
  getSeasonHistory: (seasonId: string, token: string) =>
    fetchWithAuth(`/front-office/seasons/${seasonId}/history`, token),
  triggerTransition: (seasonId: string, transition: string, token: string) =>
    fetchWithAuth(`/orchestrator/seasons/${seasonId}/transition`, token, {
      method: "POST",
      body: JSON.stringify({ targetStage: transition }),
    }),
  getDeviations: (token: string) =>
    fetchWithAuth("/front-office/deviations", token),
  getConsultations: (token: string) =>
    fetchWithAuth("/front-office/consultations", token),
  getContextUpdates: (token: string) =>
    fetchWithAuth("/front-office/context-updates", token),
  getThreads: (token?: string) => fetchWithAuth("/front-office/threads", token),
  getThread: (threadKey: string, token: string) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}`,
      token,
    ),
  getThreadMessages: (threadKey: string, token?: string) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}/messages`,
      token,
    ),
  getHandoffs: (token?: string) =>
    fetchWithAuth("/front-office/handoffs", token),
  getHandoff: (id: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}`, token),
  claimHandoff: (id: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/claim`, token, {
      method: "POST",
    }),
  rejectHandoff: (id: string, reason: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/reject`, token, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  resolveHandoff: (
    id: string,
    payload: { ownerResultRef?: string; note?: string },
    token: string,
  ) =>
    fetchWithAuth(`/front-office/handoffs/${id}/resolve`, token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  addHandoffNote: (id: string, note: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/manual-note`, token, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  getManagerBootstrap: (token?: string) =>
    fetchWithAuth("/front-office/manager/bootstrap", token),
  getManagerFarms: (token?: string) =>
    fetchWithAuth("/front-office/manager/farms", token),
  getManagerFarmThreads: (farmId: string, token?: string) =>
    fetchWithAuth(
      `/front-office/manager/farms/${encodeURIComponent(farmId)}/threads`,
      token,
    ),
  replyToThread: (threadKey: string, messageText: string, token?: string) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}/reply`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ messageText }),
      },
    ),
  markThreadRead: (threadKey: string, lastMessageId?: string, token?: string) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}/read`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ lastMessageId }),
      },
    ),
  getAssignments: (token?: string) =>
    fetchWithAuth("/front-office/assignments", token),
  createAssignment: (
    payload: {
      userId: string;
      farmAccountId: string;
      status?: string;
      priority?: number;
    },
    token?: string,
  ) =>
    fetchWithAuth("/front-office/assignments", token, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteAssignment: (id: string, token?: string) =>
    fetchWithAuth(
      `/front-office/assignments/${encodeURIComponent(id)}`,
      token,
      {
        method: "DELETE",
      },
    ),
};
