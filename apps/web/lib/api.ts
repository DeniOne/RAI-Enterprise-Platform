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
    partyManagement: {
        // Tenant Discovery (public, no JWT)
        tenant: () => apiClient.get('/commerce/tenant'),

        // Юрисдикции
        jurisdictions: () =>
            apiClient.get('/commerce/jurisdictions'),
        createJurisdiction: (data: { code: string; name: string }) =>
            apiClient.post('/commerce/jurisdictions', data),
        updateJurisdiction: (jurisdictionId: string, data: { code?: string; name?: string }) =>
            apiClient.patch(`/commerce/jurisdictions/${encodeURIComponent(jurisdictionId)}`, data),
        deleteJurisdiction: (jurisdictionId: string) =>
            apiClient.delete(`/commerce/jurisdictions/${encodeURIComponent(jurisdictionId)}`),

        // Регуляторные профили
        regulatoryProfiles: (params?: { jurisdictionId?: string; isSystemPreset?: boolean }) =>
            apiClient.get('/commerce/regulatory-profiles', { params }),
        createRegulatoryProfile: (data: {
            code: string; name: string; jurisdictionId: string;
            rulesJson?: {
                vatRate: number; vatRateReduced?: number; vatRateZero?: number;
                crossBorderVatRate: number; vatPayerStatus: string; supplyType: string;
                currencyCode: string; effectiveFrom: string; effectiveTo?: string; notes?: string;
            };
        }) => apiClient.post('/commerce/regulatory-profiles', data),
        updateRegulatoryProfile: (profileId: string, data: {
            name?: string; code?: string; jurisdictionId?: string;
            rulesJson?: {
                vatRate?: number; vatRateReduced?: number; vatRateZero?: number;
                crossBorderVatRate?: number; vatPayerStatus?: string; supplyType?: string;
                currencyCode?: string; effectiveFrom?: string; effectiveTo?: string; notes?: string;
            };
        }) => apiClient.patch(`/commerce/regulatory-profiles/${encodeURIComponent(profileId)}`, data),
        deleteRegulatoryProfile: (profileId: string) =>
            apiClient.delete(`/commerce/regulatory-profiles/${encodeURIComponent(profileId)}`),


        // Party (контрагенты)
        parties: () =>
            apiClient.get('/commerce/parties'),
        partyDetails: (partyId: string) =>
            apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}`),
        createParty: (data: { legalName: string; jurisdictionId: string; regulatoryProfileId?: string; registrationData?: any }) =>
            apiClient.post('/commerce/parties', data),
        updateParty: (partyId: string, data: { legalName?: string; jurisdictionId?: string; regulatoryProfileId?: string; registrationData?: any }) =>
            apiClient.patch(`/commerce/parties/${encodeURIComponent(partyId)}`, data),
        deleteParty: (partyId: string) =>
            apiClient.delete(`/commerce/parties/${encodeURIComponent(partyId)}`),

        // Party Relations
        partyRelations: (partyId: string, companyId: string) =>
            apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}/relations`, { params: { companyId } }),
        createPartyRelation: (data: { sourcePartyId: string; targetPartyId: string; relationType: string; validFrom: string; validTo?: string; companyId: string }) =>
            apiClient.post('/commerce/party-relations', data),
    },
    commerce: {
        contracts: () => apiClient.get('/commerce/contracts'),
        fulfillment: () => apiClient.get('/commerce/fulfillment'),
        invoices: () => apiClient.get('/commerce/invoices'),
        payments: () => apiClient.get('/commerce/payments'),
        // POST/PATCH
        createContract: (data: {
            number: string; type: string; validFrom: string; validTo?: string;
            jurisdictionId: string; regulatoryProfileId?: string;
            roles: Array<{ partyId: string; role: string; isPrimary?: boolean }>;
        }) => apiClient.post('/commerce/contracts', data),
        createObligation: (data: { contractId: string; type: 'DELIVER' | 'PAY' | 'PERFORM'; dueDate?: string }) =>
            apiClient.post('/commerce/obligations', data),
        createFulfillment: (data: {
            obligationId: string; eventDomain: string; eventType: string; eventDate: string;
            batchId?: string; itemId?: string; uom?: string; qty?: number;
        }) => apiClient.post('/commerce/fulfillment-events', data),
        createInvoice: (data: {
            fulfillmentEventId: string; sellerJurisdiction: string; buyerJurisdiction: string;
            supplyType: string; vatPayerStatus: string; subtotal: number; productTaxCode?: string;
        }) => apiClient.post('/commerce/invoices/from-fulfillment', data),
        postInvoice: (invoiceId: string) => apiClient.post(`/commerce/invoices/${encodeURIComponent(invoiceId)}/post`),
        createPayment: (data: {
            payerPartyId: string; payeePartyId: string; amount: number;
            currency: string; paymentMethod: string; paidAt?: string;
        }) => apiClient.post('/commerce/payments', data),
        confirmPayment: (paymentId: string) => apiClient.post(`/commerce/payments/${encodeURIComponent(paymentId)}/confirm`),
        allocatePayment: (data: { paymentId: string; invoiceId: string; allocatedAmount: number }) =>
            apiClient.post('/commerce/payment-allocations', data),
        arBalance: (invoiceId: string) => apiClient.get(`/commerce/invoices/${encodeURIComponent(invoiceId)}/ar-balance`),
    },
    exploration: {
        showcase: (params?: { mode?: 'SEU' | 'CDU'; status?: string; page?: number; pageSize?: number }) =>
            apiClient.get('/exploration/showcase', { params }),
        createSignal: (data: { source?: 'MARKET' | 'CLIENT' | 'AI' | 'INTERNAL'; rawPayload: Record<string, unknown>; confidenceScore?: number; initiatorId?: string }) =>
            apiClient.post('/exploration/signals', data),
        triageFromSignal: (signalId: string, data?: { initiatorId?: string; explorationMode?: 'SEU' | 'CDU'; type?: 'PROBLEM' | 'IDEA' | 'RESEARCH' | 'REGULATORY' | 'OPPORTUNITY'; triageConfig?: Record<string, unknown>; ownerId?: string; timeboxDeadline?: string; riskScore?: number }) =>
            apiClient.post(`/exploration/cases/from-signal/${encodeURIComponent(signalId)}`, data ?? {}),
        transitionCase: (caseId: string, data: { targetStatus: string; role?: string }) =>
            apiClient.post(`/exploration/cases/${encodeURIComponent(caseId)}/transition`, data),
        openWarRoom: (caseId: string, data: { facilitatorId: string; deadline: string; participants: Array<{ userId: string; role: string }> }) =>
            apiClient.post(`/exploration/cases/${encodeURIComponent(caseId)}/war-room/open`, data),
        appendWarRoomEvent: (sessionId: string, data: { participantId: string; decisionData: Record<string, unknown>; signatureHash: string }) =>
            apiClient.post(`/exploration/war-room/${encodeURIComponent(sessionId)}/events`, data),
        closeWarRoom: (sessionId: string, data: { resolutionLog: Record<string, unknown>; status?: 'ACTIVE' | 'RESOLVED_WITH_DECISION' | 'TIMEOUT' }) =>
            apiClient.post(`/exploration/war-room/${encodeURIComponent(sessionId)}/close`, data),
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
