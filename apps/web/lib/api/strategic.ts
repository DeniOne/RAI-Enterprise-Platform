import axios from 'axios';

const API_BASE = 'http://localhost:4000/api';

/**
 * 🔒 Strategic API Client (Read-only)
 * Только агрегированные проекции состояния.
 */
export const strategicApi = {
    // Global State Projection (GSV-01)
    getGlobalState: async (token: string) => {
        // В будущем тут будет /api/strategic/state
        // Пока агрегируем из существующих если нужно, или мокаем для структуры
        try {
            const response = await axios.get(`${API_BASE}/strategic/state`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 3000 // Prevent infinite loading if backend hangs
            });
            return response.data;
        } catch (e) {
            console.warn('Strategic State individual endpoint not found, fallback to mock structure.');
            return {
                overall: 'ATTENTION',
                asOf: new Date().toISOString(),
                constraints: {
                    legal: 3,
                    rnd: 1,
                    ops: 0
                },
                escalations: [
                    { id: 1, type: 'LEGAL', title: 'Protocol Validation Delay', dir: 'escalating' }
                ]
            };
        }
    },

    // R&D Summary Projection
    getRdSummary: async (token: string) => {
        const response = await axios.get(`${API_BASE}/rd/experiments`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Legal/Compliance Summary
    getLegalSummary: async (token: string) => {
        // Mocking for now to match CTX-LGL-01
        return {
            requirements: [],
            obligations: [],
            sanctions: []
        };
    }
};
