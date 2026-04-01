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
  channel?: "telegram" | "web_chat" | "internal";
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
  metadata?:
    | ({
        explainabilitySummary?: string | null;
        evidenceCount?: number;
      } & Record<string, unknown>)
    | null;
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
const EXTERNAL_FRONT_OFFICE_API_BASE_PATH = "/portal/front-office";

function buildIdempotencyKey(prefix: string, parts: Array<string | null | undefined>) {
  const normalized = parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(":")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9:_-]+/g, "-")
    .slice(0, 160);

  return `${prefix}:${normalized || "request"}`.slice(0, 200);
}

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
    fetchWithAuth(`/tasks/${id}/${status}`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("task-transition", [id, status]),
      },
    }),

  // Tech Maps
  getTechMaps: (token: string) => fetchWithAuth("/tech-map", token),
  getTechMapsBySeason: (seasonId: string, token: string) =>
    fetchWithAuth(`/tech-map/season/${seasonId}`, token),
  getTechMap: (id: string, token: string) =>
    fetchWithAuth(`/tech-map/${id}`, token),
  transitionTechMap: (id: string, status: string, token: string) =>
    fetchWithAuth(`/tech-map/${id}/transition`, token, {
      method: "PATCH",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("techmap-transition", [id, status]),
      },
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
      headers: {
        "Idempotency-Key": buildIdempotencyKey("season-transition", [
          seasonId,
          transition,
        ]),
      },
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
  getThreadMessages: (
    threadKey: string,
    token?: string,
    options?: { afterId?: string; limit?: number },
  ) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}/messages${
        options?.afterId || options?.limit
          ? `?${new URLSearchParams({
              ...(options.afterId ? { afterId: options.afterId } : {}),
              ...(typeof options.limit === "number"
                ? { limit: String(options.limit) }
                : {}),
            }).toString()}`
          : ""
      }`,
      token,
    ),
  getDraft: (id: string, token?: string) =>
    fetchWithAuth(`/front-office/drafts/${encodeURIComponent(id)}`, token),
  fixDraft: (
    id: string,
    payload: {
      channel?: "telegram" | "web_chat" | "internal";
      messageText?: string;
      direction?: "inbound" | "outbound";
      threadExternalId?: string;
      dialogExternalId?: string;
      senderExternalId?: string;
      recipientExternalId?: string;
      route?: string;
      targetOwnerRole?: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: unknown;
      telemetryJson?: unknown;
      traceId?: string;
    },
    token?: string,
  ) =>
    fetchWithAuth(`/front-office/drafts/${encodeURIComponent(id)}/fix`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("fo-draft-fix", [
          id,
          payload.traceId ?? null,
          payload.fieldId ?? null,
          payload.seasonId ?? null,
          payload.taskId ?? null,
          payload.messageText ?? null,
        ]),
      },
      body: JSON.stringify(payload),
    }),
  linkDraft: (
    id: string,
    payload: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
    token?: string,
  ) =>
    fetchWithAuth(`/front-office/drafts/${encodeURIComponent(id)}/link`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("fo-draft-link", [
          id,
          payload.taskId ?? null,
          payload.fieldId ?? null,
          payload.seasonId ?? null,
          payload.farmRef ?? null,
        ]),
      },
      body: JSON.stringify(payload),
    }),
  confirmDraft: (id: string, token?: string) =>
    fetchWithAuth(`/front-office/drafts/${encodeURIComponent(id)}/confirm`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("fo-draft-confirm", [id]),
      },
    }),
  getHandoffs: (token?: string) =>
    fetchWithAuth("/front-office/handoffs", token),
  getHandoff: (id: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}`, token),
  claimHandoff: (id: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/claim`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("handoff-claim", [id]),
      },
    }),
  rejectHandoff: (id: string, reason: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/reject`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("handoff-reject", [id, reason]),
      },
      body: JSON.stringify({ reason }),
    }),
  resolveHandoff: (
    id: string,
    payload: { ownerResultRef?: string; note?: string },
    token: string,
  ) =>
    fetchWithAuth(`/front-office/handoffs/${id}/resolve`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("handoff-resolve", [
          id,
          payload.ownerResultRef ?? null,
          payload.note ?? null,
        ]),
      },
      body: JSON.stringify(payload),
    }),
  addHandoffNote: (id: string, note: string, token: string) =>
    fetchWithAuth(`/front-office/handoffs/${id}/manual-note`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("handoff-manual-note", [id, note]),
      },
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
        headers: {
          "Idempotency-Key": buildIdempotencyKey("fo-thread-reply", [
            threadKey,
            messageText,
          ]),
        },
        body: JSON.stringify({ messageText }),
      },
    ),
  markThreadRead: (threadKey: string, lastMessageId?: string, token?: string) =>
    fetchWithAuth(
      `/front-office/threads/${encodeURIComponent(threadKey)}/read`,
      token,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": buildIdempotencyKey("fo-thread-read", [
            threadKey,
            lastMessageId ?? null,
          ]),
        },
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
      headers: {
        "Idempotency-Key": buildIdempotencyKey("fo-assignment-create", [
          payload.userId,
          payload.farmAccountId,
          payload.status ?? null,
          payload.priority != null ? String(payload.priority) : null,
        ]),
      },
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

export const externalFrontOfficeApi = {
  getThreadMessages: (
    threadKey: string,
    token?: string,
    options?: { afterId?: string; limit?: number },
  ) =>
    fetchWithAuth(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}/messages${
        options?.afterId || options?.limit
          ? `?${new URLSearchParams({
              ...(options.afterId ? { afterId: options.afterId } : {}),
              ...(typeof options.limit === "number"
                ? { limit: String(options.limit) }
                : {}),
            }).toString()}`
          : ""
      }`,
      token,
    ),
  intakeMessage: (
    payload: {
      messageText: string;
      threadExternalId?: string;
      dialogExternalId?: string;
      sourceMessageId?: string;
      route?: string;
    },
    token?: string,
  ) =>
    fetchWithAuth(`${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/intake/message`, token, {
      method: "POST",
      headers: {
        "Idempotency-Key": buildIdempotencyKey("fo-external-intake", [
          payload.threadExternalId ?? null,
          payload.dialogExternalId ?? null,
          payload.sourceMessageId ?? null,
          payload.messageText,
        ]),
      },
      body: JSON.stringify(payload),
    }),
  replyToThread: (threadKey: string, messageText: string, token?: string) =>
    fetchWithAuth(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}/reply`,
      token,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": buildIdempotencyKey("fo-external-thread-reply", [
            threadKey,
            messageText,
          ]),
        },
        body: JSON.stringify({ messageText }),
      },
    ),
  markThreadRead: (threadKey: string, lastMessageId?: string, token?: string) =>
    fetchWithAuth(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}/read`,
      token,
      {
        method: "POST",
        headers: {
          "Idempotency-Key": buildIdempotencyKey("fo-external-thread-read", [
            threadKey,
            lastMessageId ?? null,
          ]),
        },
        body: JSON.stringify({ lastMessageId }),
      },
    ),
};
