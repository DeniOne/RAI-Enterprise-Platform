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

export interface SeasonSummary {
    id: string;
    year: number;
    status: string;
    fieldId?: string;
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
    getOverview: (token: string) => fetchWithAuth('/front-office/overview', token),

    // Tasks
    getMyTasks: (token: string) => fetchWithAuth('/tasks/my', token),
    getTask: (id: string, token: string) => fetchWithAuth(`/tasks/${id}`, token),
    updateTaskStatus: (id: string, status: string, token: string) =>
        fetchWithAuth(`/tasks/${id}/${status}`, token, { method: 'POST' }),

    // Tech Maps
    getTechMaps: (token: string) => fetchWithAuth('/tech-map', token),
    getTechMapsBySeason: (seasonId: string, token: string) =>
        fetchWithAuth(`/tech-map/season/${seasonId}`, token),
    getTechMap: (id: string, token: string) => fetchWithAuth(`/tech-map/${id}`, token),
    transitionTechMap: (id: string, status: string, token: string) =>
        fetchWithAuth(`/tech-map/${id}/transition`, token, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    // Orchestrator
    getSeasons: (token: string) => fetchWithAuth('/seasons', token),
    getSeason: (id: string, token: string) => fetchWithAuth(`/seasons/${id}`, token),
    getSeasonStage: (seasonId: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/stage`, token),
    getSeasonHistory: (seasonId: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/history`, token),
    triggerTransition: (seasonId: string, transition: string, token: string) =>
        fetchWithAuth(`/orchestrator/seasons/${seasonId}/transition`, token, {
            method: 'POST',
            body: JSON.stringify({ targetStage: transition }),
        }),
    getDeviations: (token: string) => fetchWithAuth('/front-office/deviations', token),
    getConsultations: (token: string) => fetchWithAuth('/front-office/consultations', token),
    getContextUpdates: (token: string) => fetchWithAuth('/front-office/context-updates', token),
};
