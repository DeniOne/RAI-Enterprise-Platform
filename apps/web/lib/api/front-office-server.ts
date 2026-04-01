import { cookies } from "next/headers";
import { EXTERNAL_FRONT_OFFICE_API_BASE_PATH } from "@/lib/front-office-routes";

const BASE_URL = "http://localhost:4000/api";

async function fetchFrontOffice(path: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Front-office fetch failed: ${response.status} ${path}`);
  }

  return response.json();
}

export const frontOfficeServerApi = {
  overview: () => fetchFrontOffice("/front-office/overview"),
  queues: () => fetchFrontOffice("/front-office/queues"),
  fields: () => fetchFrontOffice("/registry/fields"),
  field: (id: string) => fetchFrontOffice(`/registry/fields/${id}`),
  seasons: () => fetchFrontOffice("/seasons"),
  season: (id: string) => fetchFrontOffice(`/seasons/${id}`),
  seasonHistory: (id: string) => fetchFrontOffice(`/front-office/seasons/${id}/history`),
  techMaps: () => fetchFrontOffice("/tech-map"),
  techMap: (id: string) => fetchFrontOffice(`/tech-map/${id}`),
  tasks: () => fetchFrontOffice("/tasks/my"),
  task: (id: string) => fetchFrontOffice(`/tasks/${id}`),
  taskObservations: (id: string) => fetchFrontOffice(`/field-observation/task/${id}`),
  deviations: () => fetchFrontOffice("/front-office/deviations"),
  consultations: () => fetchFrontOffice("/front-office/consultations"),
  contextUpdates: () => fetchFrontOffice("/front-office/context-updates"),
  threads: () => fetchFrontOffice("/front-office/threads"),
  thread: (threadKey: string) =>
    fetchFrontOffice(`/front-office/threads/${encodeURIComponent(threadKey)}`),
  threadMessages: (threadKey: string) =>
    fetchFrontOffice(`/front-office/threads/${encodeURIComponent(threadKey)}/messages`),
  handoffs: () => fetchFrontOffice("/front-office/handoffs"),
  handoff: (id: string) => fetchFrontOffice(`/front-office/handoffs/${id}`),
  managerBootstrap: () => fetchFrontOffice("/front-office/manager/bootstrap"),
  managerFarms: () => fetchFrontOffice("/front-office/manager/farms"),
  managerFarmThreads: (farmId: string) =>
    fetchFrontOffice(`/front-office/manager/farms/${encodeURIComponent(farmId)}/threads`),
  replyToThread: (threadKey: string, messageText: string) =>
    fetchFrontOffice(`/front-office/threads/${encodeURIComponent(threadKey)}/reply`, {
      method: "POST",
      body: JSON.stringify({ messageText }),
    }),
  markThreadRead: (threadKey: string, lastMessageId?: string) =>
    fetchFrontOffice(`/front-office/threads/${encodeURIComponent(threadKey)}/read`, {
      method: "POST",
      body: JSON.stringify({ lastMessageId }),
    }),
  assignments: () => fetchFrontOffice("/front-office/assignments"),
};

export const externalFrontOfficeServerApi = {
  threads: () => fetchFrontOffice(`${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads`),
  thread: (threadKey: string) =>
    fetchFrontOffice(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}`,
    ),
  threadMessages: (
    threadKey: string,
    options?: { afterId?: string; limit?: number },
  ) =>
    fetchFrontOffice(
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
    ),
  intakeMessage: (payload: {
    messageText: string;
    threadExternalId?: string;
    dialogExternalId?: string;
    sourceMessageId?: string;
    route?: string;
  }) =>
    fetchFrontOffice(`${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/intake/message`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  replyToThread: (threadKey: string, messageText: string) =>
    fetchFrontOffice(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ messageText }),
      },
    ),
  markThreadRead: (threadKey: string, lastMessageId?: string) =>
    fetchFrontOffice(
      `${EXTERNAL_FRONT_OFFICE_API_BASE_PATH}/threads/${encodeURIComponent(threadKey)}/read`,
      {
        method: "POST",
        body: JSON.stringify({ lastMessageId }),
      },
    ),
};
