export interface Field {
    id: string;
    name: string;
    area: number;
    status: string;
}

export interface Task {
    id: string;
    name: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
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

const BASE_URL = 'http://localhost:4000/api';

async function fetchWithAuth(path: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} at ${path}`);
    }

    return response.json();
}

export const frontOfficeApi = {
    // Fields
    getFields: (token: string) => fetchWithAuth('/registry/fields', token),
    getField: (id: string, token: string) => fetchWithAuth(`/registry/fields/${id}`, token),

    // Tasks
    getMyTasks: (token: string) => fetchWithAuth('/tasks/my', token),
    getTask: (id: string, token: string) => fetchWithAuth(`/tasks/${id}`, token),
    updateTaskStatus: (id: string, status: string, token: string) =>
        fetchWithAuth(`/tasks/${id}/${status}`, token, { method: 'POST' }),

    // Tech Maps
    getTechMapsBySeason: (seasonId: string, token: string) =>
        fetchWithAuth(`/tech-map/season/${seasonId}`, token),
    getTechMap: (id: string, token: string) => fetchWithAuth(`/tech-map/${id}`, token),
    activateTechMap: (id: string, token: string) =>
        fetchWithAuth(`/tech-map/${id}/activate`, token, { method: 'POST' }),

    // Orchestrator
    getSeasonStage: (seasonId: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/stage`, token),
    getSeasonHistory: (seasonId: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/history`, token),
    triggerTransition: (seasonId: string, transition: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/transition`, token, {
            method: 'POST',
            body: JSON.stringify({ transition }),
        }),
};
