import { cookies } from "next/headers";

const BASE_URL = "http://localhost:4000/api";

async function fetchFrontOffice(path: string) {
  const token = cookies().get("auth_token")?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
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
};
