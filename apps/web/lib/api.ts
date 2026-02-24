import axios from 'axios'

// Axios client for browser-side requests only.
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
})

// Do not force global redirect on HTTP 401 from client requests.
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Each page should handle unauthorized responses locally.
        return Promise.reject(error)
    }
)

// Typed client endpoints.
export const api = {
    users: {
        me: () => apiClient.get('/users/me'),
        company: (companyId: string) => apiClient.get(`/users/company/${encodeURIComponent(companyId)}`),
    },
    tasks: {
        list: () => apiClient.get('/tasks'),
        create: (data: unknown) => apiClient.post('/tasks', data),
    },
    fields: {
        list: () => apiClient.get('/fields'),
    },
    consulting: {
        plans: () => apiClient.get('/consulting/plans'),
        createPlan: (data: unknown) => apiClient.post('/consulting/plans', data),
        transitionPlan: (planId: string, status: string) =>
            apiClient.post(`/consulting/plans/${planId}/transitions`, { status }),
        techmaps: {
            list: () => apiClient.get('/tech-map'),
            transition: (id: string, status: string) =>
                apiClient.patch(`/tech-map/${id}/transition`, { status }),
        },
        execution: {
            list: () => apiClient.get('/consulting/execution/operations'),
            active: () => apiClient.get('/consulting/execution/active'),
            start: (operationId: string) => apiClient.post(`/consulting/execution/start/${operationId}`),
            complete: (data: unknown) => apiClient.post('/consulting/execution/complete', data),
        },
        yield: {
            save: (data: unknown) => apiClient.post('/consulting/yield', data),
            getByPlan: (planId: string) => apiClient.get(`/consulting/yield/plan/${planId}`),
        },
        kpi: {
            plan: (planId: string) => apiClient.get(`/consulting/kpi/plan/${planId}`),
            company: (seasonId: string) => apiClient.get(`/consulting/kpi/company/${seasonId}`),
        },
    },
    crm: {
        holdings: (companyId: string) => apiClient.get(`/crm/holdings/${companyId}`),
        createHolding: (data: { name: string; description?: string; companyId: string }) =>
            apiClient.post('/crm/holdings', data),
        fields: () => apiClient.get('/registry/fields'),
        plans: () => apiClient.get('/consulting/plans'),
        accounts: (companyId: string, params?: { search?: string; type?: string; status?: string; riskCategory?: string; responsibleId?: string }) =>
            apiClient.get(`/crm/accounts/${companyId}`, { params }),
        createAccount: (data: { name: string; inn?: string; type?: string; holdingId?: string; companyId: string }) =>
            apiClient.post('/crm/accounts', data),
        accountDetails: (accountId: string, companyId: string) =>
            apiClient.get(`/crm/accounts/${encodeURIComponent(accountId)}/details/${companyId}`),
        accountWorkspace: (accountId: string, companyId: string) =>
            apiClient.get(`/crm/accounts/${encodeURIComponent(accountId)}/workspace`, { params: { companyId } }),
        updateAccount: (accountId: string, data: { companyId: string; name?: string; inn?: string | null; type?: string; status?: string; holdingId?: string | null; jurisdiction?: string | null; riskCategory?: string; strategicValue?: string }) =>
            apiClient.patch(`/crm/accounts/${encodeURIComponent(accountId)}`, data),
        createContact: (accountId: string, data: { companyId: string; firstName: string; lastName?: string; role?: string; influenceLevel?: number; email?: string; phone?: string; source?: string }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/contacts`, data),
        updateContact: (contactId: string, data: { companyId: string; firstName?: string; lastName?: string | null; role?: string; influenceLevel?: number | null; email?: string | null; phone?: string | null; source?: string | null }) =>
            apiClient.patch(`/crm/contacts/${encodeURIComponent(contactId)}`, data),
        deleteContact: (contactId: string, companyId: string) =>
            apiClient.delete(`/crm/contacts/${encodeURIComponent(contactId)}`, { params: { companyId } }),
        createInteraction: (accountId: string, data: { companyId: string; type: string; summary: string; date?: string; contactId?: string | null; relatedEventId?: string | null }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/interactions`, data),
        updateInteraction: (interactionId: string, data: { companyId: string; type?: string; summary?: string; date?: string; contactId?: string | null; relatedEventId?: string | null }) =>
            apiClient.patch(`/crm/interactions/${encodeURIComponent(interactionId)}`, data),
        deleteInteraction: (interactionId: string, companyId: string) =>
            apiClient.delete(`/crm/interactions/${encodeURIComponent(interactionId)}`, { params: { companyId } }),
        createObligation: (accountId: string, data: { companyId: string; description: string; dueDate: string; responsibleUserId?: string | null; status?: string }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/obligations`, data),
        updateObligation: (obligationId: string, data: { companyId: string; description?: string; dueDate?: string; responsibleUserId?: string | null; status?: string }) =>
            apiClient.patch(`/crm/obligations/${encodeURIComponent(obligationId)}`, data),
        deleteObligation: (obligationId: string, companyId: string) =>
            apiClient.delete(`/crm/obligations/${encodeURIComponent(obligationId)}`, { params: { companyId } }),
        updateAccountHolding: (accountId: string, data: { holdingId: string | null; companyId: string }) =>
            apiClient.put(`/crm/accounts/${encodeURIComponent(accountId)}/holding`, data),
        farmsRegistry: (companyId: string, params?: { search?: string; severity?: string; sort?: string; onlyRisk?: boolean; page?: number; pageSize?: number }) =>
            apiClient.get(`/crm/farms/registry/${companyId}`, { params }),
        farmMap: (farmId: string, companyId: string) =>
            apiClient.get(`/crm/farms/${encodeURIComponent(farmId)}/map/${companyId}`),
    },
}
