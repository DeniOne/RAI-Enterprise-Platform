import axios from 'axios'

import type { AiWorkWindow } from '../components/ai-chat/ai-work-window-types'
import type { WorkspaceContext } from '../shared/contracts/workspace-context'
import type { RaiChatWidget } from './ai-chat-widgets'

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

export function buildIdempotencyKey(prefix: string, parts: Array<string | null | undefined>): string {
    const normalized = parts
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean)
        .join(':')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9:_-]+/g, '-')
        .slice(0, 160);

    return `${prefix}:${normalized || 'request'}`.slice(0, 200);
}

export function serializeIdempotencyPayload(value: unknown): string {
    try {
        return JSON.stringify(value) ?? '';
    } catch {
        return '';
    }
}

function trimHtmlLikePayload(raw: string): string {
    return raw
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220);
}

async function getRaiChatHttpErrorMessage(response: Response): Promise<string> {
    const status = response.status;
    const contentType = response.headers?.get?.('content-type') ?? '';
    let details = '';

    try {
        if (contentType.includes('application/json')) {
            const payload = await response.json() as { message?: unknown; error?: unknown };
            if (Array.isArray(payload.message)) {
                details = payload.message.map((item) => String(item)).filter(Boolean).join('; ');
            } else if (typeof payload.message === 'string') {
                details = payload.message;
            } else if (typeof payload.error === 'string') {
                details = payload.error;
            }
        } else {
            const text = await response.text();
            if (text?.trim()) {
                details = trimHtmlLikePayload(text);
            }
        }
    } catch {
        details = '';
    }

    const normalizedDetails = details.toLowerCase();

    if (status === 404) {
        return 'Клиент чата устарел после перезапуска. Обновите страницу Ctrl+Shift+R и повторите команду.';
    }

    if (normalizedDetails.includes('idempotency-key')) {
        return 'Клиент отправил запрос без Idempotency-Key. Обновите страницу Ctrl+Shift+R и повторите команду.';
    }

    if (status >= 500) {
        return 'Сервис агента временно недоступен. Повторите команду через 5-10 секунд.';
    }

    if (details) {
        return `Ошибка агента: ${details}`;
    }

    return `Ошибка агента: HTTP ${status}`;
}

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
        plan: (planId: string) => apiClient.get(`/consulting/plans/${encodeURIComponent(planId)}`),
        createPlan: (data: unknown) =>
            apiClient.post('/consulting/plans', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('consulting-create-plan', [
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        transitionPlan: (planId: string, status: string) =>
            apiClient.post(`/consulting/plans/${planId}/transitions`, { status }, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('consulting-plan-transition', [planId, status]),
                },
            }),
        techmaps: {
            list: () => apiClient.get('/tech-map'),
            get: (id: string) => apiClient.get(`/tech-map/${encodeURIComponent(id)}`),
            generate: (data: { harvestPlanId: string; seasonId: string }) =>
                apiClient.post('/tech-map/generate', data, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('techmap-generate', [
                            data.harvestPlanId,
                            data.seasonId,
                        ]),
                    },
                }),
            transition: (id: string, status: string) =>
                apiClient.patch(
                    `/tech-map/${id}/transition`,
                    { status },
                    {
                        headers: {
                            'Idempotency-Key': buildIdempotencyKey('techmap-transition', [id, status]),
                        },
                    },
                ),
        },
        execution: {
            list: () => apiClient.get('/consulting/execution/operations'),
            active: () => apiClient.get('/consulting/execution/operations'),
            start: (operationId: string) =>
                apiClient.post(`/consulting/execution/${operationId}/start`, undefined, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('consulting-execution-start', [operationId]),
                    },
                }),
            complete: (data: unknown) =>
                apiClient.post('/consulting/execution/complete', data, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('consulting-execution-complete', [
                            serializeIdempotencyPayload(data),
                        ]),
                    },
                }),
        },
        yield: {
            save: (data: unknown) =>
                apiClient.post('/consulting/yield', data, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('consulting-yield-save', [
                            serializeIdempotencyPayload(data),
                        ]),
                    },
                }),
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
            apiClient.post('/commerce/jurisdictions', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-jurisdiction-create', [
                        data.code,
                        data.name,
                    ]),
                },
            }),
        updateJurisdiction: (jurisdictionId: string, data: { code?: string; name?: string }) =>
            apiClient.patch(`/commerce/jurisdictions/${encodeURIComponent(jurisdictionId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-jurisdiction-update', [
                        jurisdictionId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
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
        }) => apiClient.post('/commerce/regulatory-profiles', data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-reg-profile-create', [
                    data.code,
                    data.jurisdictionId,
                    serializeIdempotencyPayload(data.rulesJson ?? {}),
                ]),
            },
        }),
        updateRegulatoryProfile: (profileId: string, data: {
            name?: string; code?: string; jurisdictionId?: string;
            rulesJson?: {
                vatRate?: number; vatRateReduced?: number; vatRateZero?: number;
                crossBorderVatRate?: number; vatPayerStatus?: string; supplyType?: string;
                currencyCode?: string; effectiveFrom?: string; effectiveTo?: string; notes?: string;
            };
        }) => apiClient.patch(`/commerce/regulatory-profiles/${encodeURIComponent(profileId)}`, data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-reg-profile-update', [
                    profileId,
                    serializeIdempotencyPayload(data),
                ]),
            },
        }),
        deleteRegulatoryProfile: (profileId: string) =>
            apiClient.delete(`/commerce/regulatory-profiles/${encodeURIComponent(profileId)}`),


        // Party (контрагенты)
        parties: () =>
            apiClient.get('/commerce/parties'),
        partyDetails: (partyId: string) =>
            apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}`),
        createParty: (data: { legalName: string; jurisdictionId: string; regulatoryProfileId?: string; registrationData?: any }) =>
            apiClient.post('/commerce/parties', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-party-create', [
                        data.legalName,
                        data.jurisdictionId,
                        serializeIdempotencyPayload(data.registrationData ?? {}),
                    ]),
                },
            }),
        updateParty: (partyId: string, data: { legalName?: string; jurisdictionId?: string; regulatoryProfileId?: string; registrationData?: any }) =>
            apiClient.patch(`/commerce/parties/${encodeURIComponent(partyId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-party-update', [
                        partyId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        deleteParty: (partyId: string) =>
            apiClient.delete(`/commerce/parties/${encodeURIComponent(partyId)}`),

        // Party Relations
        partyRelations: (partyId: string, companyId: string) =>
            apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}/relations`, { params: { companyId } }),
        createPartyRelation: (data: { sourcePartyId: string; targetPartyId: string; relationType: string; validFrom: string; validTo?: string; companyId: string }) =>
            apiClient.post('/commerce/party-relations', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-party-relation-create', [
                        data.sourcePartyId,
                        data.targetPartyId,
                        data.relationType,
                        data.validFrom,
                    ]),
                },
            }),
    },
    partyAssets: {
        identificationSchema: (jurisdictionId: string, partyType: string) =>
            apiClient.get(`/jurisdictions/${encodeURIComponent(jurisdictionId)}/identification-schema`, { params: { partyType } }),
        lookupParty: (data: {
            jurisdictionId: 'RU' | 'BY' | 'KZ';
            partyType: 'LEGAL_ENTITY' | 'IP' | 'KFH';
            identifiers: { inn?: string; kpp?: string; unp?: string; bin?: string };
        }) => apiClient.post('/party-lookup', data),
        parties: (params?: { type?: string; jurisdictionId?: string; q?: string }) =>
            apiClient.get('/parties', { params }),
        partyDetails: (partyId: string) =>
            apiClient.get(`/parties/${encodeURIComponent(partyId)}`),
        partyRelations: (partyId: string) =>
            apiClient.get(`/parties/${encodeURIComponent(partyId)}/relations`),
        partyAssets: (partyId: string) =>
            apiClient.get(`/parties/${encodeURIComponent(partyId)}/assets`),
        createParty: (data: {
            type: 'HOLDING' | 'LEGAL_ENTITY' | 'IP' | 'KFH' | 'MANAGEMENT_CO' | 'BANK' | 'INSURER';
            legalName: string;
            shortName?: string;
            jurisdictionId: string;
            status?: 'ACTIVE' | 'FROZEN';
            comment?: string;
            registrationData?: {
                partyType?: 'HOLDING' | 'LEGAL_ENTITY' | 'IP' | 'KFH' | 'MANAGEMENT_CO' | 'BANK' | 'INSURER';
                status?: 'ACTIVE' | 'FROZEN';
                shortName?: string;
                legalForm?: string;
                comment?: string;
                inn?: string;
                kpp?: string;
                ogrn?: string;
                ogrnip?: string;
                unp?: string;
                bin?: string;
                addresses?: Array<{ type: string; address: string }>;
                contacts?: Array<{
                    roleType: 'SIGNATORY' | 'OPERATIONAL';
                    fullName: string;
                    position?: string;
                    basisOfAuthority?: string;
                    phones?: string;
                    email?: string;
                }>;
                banks?: Array<{
                    bankName: string;
                    accountNumber: string;
                    bic?: string;
                    corrAccount?: string;
                    currency?: string;
                    isPrimary?: boolean;
                }>;
                dataProvenance?: { lookupSource: string; fetchedAt: string; requestKey: string };
            };
        }) => apiClient.post('/parties', {
            type: data.type,
            legalName: data.legalName,
            shortName: data.shortName,
            jurisdictionId: data.jurisdictionId,
            status: data.status,
            comment: data.comment,
            registrationData: data.registrationData,
        }, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('party-assets-party-create', [
                    data.type,
                    data.legalName,
                    data.jurisdictionId,
                ]),
            },
        }),
        createPartyRelation: (data: {
            fromPartyId: string;
            toPartyId: string;
            relationType: 'OWNERSHIP' | 'MANAGEMENT' | 'AFFILIATED' | 'AGENCY';
            sharePct?: number;
            validFrom: string;
            validTo?: string;
            basisDocId?: string;
        }) => apiClient.post('/party-relations', {
            fromPartyId: data.fromPartyId,
            toPartyId: data.toPartyId,
            relationType: data.relationType,
            sharePct: data.sharePct,
            validFrom: data.validFrom,
            validTo: data.validTo,
            basisDocId: data.basisDocId,
        }, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('party-assets-relation-create', [
                    data.fromPartyId,
                    data.toPartyId,
                    data.relationType,
                    data.validFrom,
                ]),
            },
        }),
        farms: (params?: { q?: string; holdingId?: string; operatorId?: string; hasLease?: boolean }) =>
            apiClient.get('/assets/farms', { params }),
        farmDetails: (farmId: string) =>
            apiClient.get(`/assets/farms/${encodeURIComponent(farmId)}`),
        farmFields: (farmId: string) =>
            apiClient.get(`/assets/farms/${encodeURIComponent(farmId)}/fields`),
        createFarm: (data: { name: string; regionCode?: string; status?: 'ACTIVE' | 'ARCHIVED' }) =>
            apiClient.post('/assets/farms', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('party-assets-farm-create', [
                        data.name,
                        data.regionCode ?? null,
                        data.status ?? null,
                    ]),
                },
            }),
        assetRoles: (assetId: string) =>
            apiClient.get(`/assets/${encodeURIComponent(assetId)}/roles`),
        assignAssetRole: (data: {
            assetId: string;
            partyId: string;
            role: 'OWNER' | 'OPERATOR' | 'LESSEE' | 'MANAGER' | 'BENEFICIARY';
            validFrom: string;
            validTo?: string;
        }) => apiClient.post(`/assets/${encodeURIComponent(data.assetId)}/roles`, data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('party-assets-role-create', [
                    data.assetId,
                    data.partyId,
                    data.role,
                    data.validFrom,
                ]),
            },
        }),
        fields: () => apiClient.get('/api/assets/fields'),
        objects: () => apiClient.get('/api/assets/objects'),
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
        }) => apiClient.post('/commerce/contracts', data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-contract-create', [
                    data.number,
                    data.type,
                    data.validFrom,
                    serializeIdempotencyPayload(data.roles),
                ]),
            },
        }),
        createObligation: (data: { contractId: string; type: 'DELIVER' | 'PAY' | 'PERFORM'; dueDate?: string }) =>
            apiClient.post('/commerce/obligations', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-obligation-create', [
                        data.contractId,
                        data.type,
                        data.dueDate ?? null,
                    ]),
                },
            }),
        createFulfillment: (data: {
            obligationId: string; eventDomain: string; eventType: string; eventDate: string;
            batchId?: string; itemId?: string; uom?: string; qty?: number;
        }) => apiClient.post('/commerce/fulfillment-events', data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-fulfillment-create', [
                    data.obligationId,
                    data.eventDomain,
                    data.eventType,
                    data.eventDate,
                    data.batchId ?? null,
                    data.itemId ?? null,
                ]),
            },
        }),
        createInvoice: (data: {
            fulfillmentEventId: string; sellerJurisdiction: string; buyerJurisdiction: string;
            supplyType: string; vatPayerStatus: string; subtotal: number; productTaxCode?: string;
        }) => apiClient.post('/commerce/invoices/from-fulfillment', data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-invoice-create', [
                    data.fulfillmentEventId,
                    data.sellerJurisdiction,
                    data.buyerJurisdiction,
                    data.supplyType,
                    `${data.subtotal}`,
                ]),
            },
        }),
        postInvoice: (invoiceId: string) => apiClient.post(`/commerce/invoices/${encodeURIComponent(invoiceId)}/post`, undefined, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-invoice-post', [invoiceId]),
            },
        }),
        createPayment: (data: {
            payerPartyId: string; payeePartyId: string; amount: number;
            currency: string; paymentMethod: string; paidAt?: string;
        }) => apiClient.post('/commerce/payments', data, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-payment-create', [
                    data.payerPartyId,
                    data.payeePartyId,
                    `${data.amount}`,
                    data.currency,
                    data.paymentMethod,
                    data.paidAt ?? null,
                ]),
            },
        }),
        confirmPayment: (paymentId: string) => apiClient.post(`/commerce/payments/${encodeURIComponent(paymentId)}/confirm`, undefined, {
            headers: {
                'Idempotency-Key': buildIdempotencyKey('commerce-payment-confirm', [paymentId]),
            },
        }),
        allocatePayment: (data: { paymentId: string; invoiceId: string; allocatedAmount: number }) =>
            apiClient.post('/commerce/payment-allocations', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('commerce-payment-allocation', [
                        data.paymentId,
                        data.invoiceId,
                        `${data.allocatedAmount}`,
                    ]),
                },
            }),
        arBalance: (invoiceId: string) => apiClient.get(`/commerce/invoices/${encodeURIComponent(invoiceId)}/ar-balance`),
    },
    exploration: {
        showcase: (params?: { mode?: 'SEU' | 'CDU'; status?: string; page?: number; pageSize?: number }) =>
            apiClient.get('/exploration/showcase', { params }),
        createSignal: (data: { source?: 'MARKET' | 'CLIENT' | 'AI' | 'INTERNAL'; rawPayload: Record<string, unknown>; confidenceScore?: number; initiatorId?: string }) =>
            apiClient.post('/exploration/signals', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-signal-create', [
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        triageFromSignal: (signalId: string, data?: { initiatorId?: string; explorationMode?: 'SEU' | 'CDU'; type?: 'PROBLEM' | 'IDEA' | 'RESEARCH' | 'REGULATORY' | 'OPPORTUNITY'; triageConfig?: Record<string, unknown>; ownerId?: string; timeboxDeadline?: string; riskScore?: number }) =>
            apiClient.post(`/exploration/cases/from-signal/${encodeURIComponent(signalId)}`, data ?? {}, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-triage', [
                        signalId,
                        serializeIdempotencyPayload(data ?? {}),
                    ]),
                },
            }),
        transitionCase: (caseId: string, data: { targetStatus: string; role?: string }) =>
            apiClient.post(`/exploration/cases/${encodeURIComponent(caseId)}/transition`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-transition', [
                        caseId,
                        data.targetStatus,
                        data.role,
                    ]),
                },
            }),
        openWarRoom: (caseId: string, data: { facilitatorId: string; deadline: string; participants: Array<{ userId: string; role: string }> }) =>
            apiClient.post(`/exploration/cases/${encodeURIComponent(caseId)}/war-room/open`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-war-room-open', [
                        caseId,
                        data.facilitatorId,
                        data.deadline,
                        serializeIdempotencyPayload(data.participants),
                    ]),
                },
            }),
        appendWarRoomEvent: (sessionId: string, data: { participantId: string; decisionData: Record<string, unknown>; signatureHash: string }) =>
            apiClient.post(`/exploration/war-room/${encodeURIComponent(sessionId)}/events`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-war-room-event', [
                        sessionId,
                        data.participantId,
                        data.signatureHash,
                    ]),
                },
            }),
        closeWarRoom: (sessionId: string, data: { resolutionLog: Record<string, unknown>; status?: 'ACTIVE' | 'RESOLVED_WITH_DECISION' | 'TIMEOUT' }) =>
            apiClient.post(`/exploration/war-room/${encodeURIComponent(sessionId)}/close`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('exploration-war-room-close', [
                        sessionId,
                        data.status,
                        serializeIdempotencyPayload(data.resolutionLog),
                    ]),
                },
            }),
    },
    crm: {
        holdings: (companyId: string) => apiClient.get(`/crm/holdings/${companyId}`),
        createHolding: (data: { name: string; description?: string; companyId: string }) =>
            apiClient.post('/crm/holdings', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-holding-create', [
                        data.companyId,
                        data.name,
                    ]),
                },
            }),
        fields: () => apiClient.get('/registry/fields'),
        createField: (data: {
            cadastreNumber: string;
            name?: string;
            area: number;
            coordinates: unknown;
            soilType: string;
            accountId: string;
            companyId: string;
        }) =>
            apiClient.post('/registry/fields', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('registry-field-create', [
                        data.companyId,
                        data.accountId,
                        data.cadastreNumber,
                    ]),
                },
            }),
        plans: () => apiClient.get('/consulting/plans'),
        accounts: (companyId: string, params?: { search?: string; type?: string; status?: string; riskCategory?: string; responsibleId?: string }) =>
            apiClient.get(`/crm/accounts/${companyId}`, { params }),
        createAccount: (data: { name: string; inn?: string; type?: string; holdingId?: string; companyId: string }) =>
            apiClient.post('/crm/accounts', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-account-create', [
                        data.companyId,
                        data.name,
                        data.inn ?? null,
                    ]),
                },
            }),
        accountDetails: (accountId: string, companyId: string) =>
            apiClient.get(`/crm/accounts/${encodeURIComponent(accountId)}/details/${companyId}`),
        accountWorkspace: (accountId: string, companyId: string) =>
            apiClient.get(`/crm/accounts/${encodeURIComponent(accountId)}/workspace`, { params: { companyId } }),
        updateAccount: (accountId: string, data: { companyId: string; name?: string; inn?: string | null; type?: string; status?: string; holdingId?: string | null; jurisdiction?: string | null; riskCategory?: string; strategicValue?: string }) =>
            apiClient.patch(`/crm/accounts/${encodeURIComponent(accountId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-account-update', [
                        accountId,
                        data.companyId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        createContact: (accountId: string, data: { companyId: string; firstName: string; lastName?: string; role?: string; influenceLevel?: number; email?: string; phone?: string; source?: string }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/contacts`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-contact-create', [
                        accountId,
                        data.companyId,
                        data.firstName,
                        data.lastName ?? null,
                    ]),
                },
            }),
        updateContact: (contactId: string, data: { companyId: string; firstName?: string; lastName?: string | null; role?: string; influenceLevel?: number | null; email?: string | null; phone?: string | null; source?: string | null }) =>
            apiClient.patch(`/crm/contacts/${encodeURIComponent(contactId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-contact-update', [
                        contactId,
                        data.companyId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        deleteContact: (contactId: string, companyId: string) =>
            apiClient.delete(`/crm/contacts/${encodeURIComponent(contactId)}`, { params: { companyId } }),
        createInteraction: (accountId: string, data: { companyId: string; type: string; summary: string; date?: string; contactId?: string | null; relatedEventId?: string | null }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/interactions`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-interaction-create', [
                        accountId,
                        data.companyId,
                        data.type,
                        data.summary,
                    ]),
                },
            }),
        updateInteraction: (interactionId: string, data: { companyId: string; type?: string; summary?: string; date?: string; contactId?: string | null; relatedEventId?: string | null }) =>
            apiClient.patch(`/crm/interactions/${encodeURIComponent(interactionId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-interaction-update', [
                        interactionId,
                        data.companyId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        deleteInteraction: (interactionId: string, companyId: string) =>
            apiClient.delete(`/crm/interactions/${encodeURIComponent(interactionId)}`, { params: { companyId } }),
        createObligation: (accountId: string, data: { companyId: string; description: string; dueDate: string; responsibleUserId?: string | null; status?: string }) =>
            apiClient.post(`/crm/accounts/${encodeURIComponent(accountId)}/obligations`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-obligation-create', [
                        accountId,
                        data.companyId,
                        data.description,
                        data.dueDate,
                    ]),
                },
            }),
        updateObligation: (obligationId: string, data: { companyId: string; description?: string; dueDate?: string; responsibleUserId?: string | null; status?: string }) =>
            apiClient.patch(`/crm/obligations/${encodeURIComponent(obligationId)}`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-obligation-update', [
                        obligationId,
                        data.companyId,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        deleteObligation: (obligationId: string, companyId: string) =>
            apiClient.delete(`/crm/obligations/${encodeURIComponent(obligationId)}`, { params: { companyId } }),
        updateAccountHolding: (accountId: string, data: { holdingId: string | null; companyId: string }) =>
            apiClient.put(`/crm/accounts/${encodeURIComponent(accountId)}/holding`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('crm-account-holding-update', [
                        accountId,
                        data.companyId,
                        data.holdingId ?? 'detached',
                    ]),
                },
            }),
        farmsRegistry: (companyId: string, params?: { search?: string; severity?: string; sort?: string; onlyRisk?: boolean; page?: number; pageSize?: number }) =>
            apiClient.get(`/crm/farms/registry/${companyId}`, { params }),
        farmMap: (farmId: string, companyId: string) =>
            apiClient.get(`/crm/farms/${encodeURIComponent(farmId)}/map/${companyId}`),
    },
    explainability: {
        dashboard: (params?: { hours?: number }) =>
            apiClient.get<TruthfulnessDashboardDto>('/rai/explainability/dashboard', { params: params?.hours != null ? { hours: params.hours } : {} }),
        performance: (params?: { timeWindowMs?: number }) =>
            apiClient.get('/rai/explainability/performance', { params: params?.timeWindowMs != null ? { timeWindowMs: params.timeWindowMs } : {} }),
        queuePressure: (params?: { timeWindowMs?: number }) =>
            apiClient.get('/rai/explainability/queue-pressure', { params: params?.timeWindowMs != null ? { timeWindowMs: params.timeWindowMs } : {} }),
        routingDivergence: (params?: { windowHours?: number; slice?: string; decisionType?: string; targetRole?: string; onlyMismatches?: boolean }) =>
            apiClient.get('/rai/explainability/routing/divergence', { params: params ?? {} }),
        captureRoutingCaseMemoryCandidate: (data: { key: string; windowHours?: number; slice?: string; targetRole?: string; note?: string }) =>
            apiClient.post('/rai/explainability/routing/case-memory-candidates/capture', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('routing-case-memory-candidate-capture', [
                        data.key,
                        data.slice ?? 'all',
                        data.targetRole ?? 'all',
                        `${data.windowHours ?? 24}`,
                    ]),
                },
            }),
        runtimeGovernanceSummary: (params?: { timeWindowMs?: number }) =>
            apiClient.get<RuntimeGovernanceSummaryDto>('/rai/explainability/runtime-governance/summary', { params: params?.timeWindowMs != null ? { timeWindowMs: params.timeWindowMs } : {} }),
        runtimeGovernanceAgents: (params?: { timeWindowMs?: number }) =>
            apiClient.get<RuntimeGovernanceAgentDto[]>('/rai/explainability/runtime-governance/agents', { params: params?.timeWindowMs != null ? { timeWindowMs: params.timeWindowMs } : {} }),
        runtimeGovernanceDrilldowns: (params?: { timeWindowMs?: number; agentRole?: string }) =>
            apiClient.get<RuntimeGovernanceDrilldownsDto>('/rai/explainability/runtime-governance/drilldowns', { params: params ?? {} }),
        lifecycleSummary: () =>
            apiClient.get<AgentLifecycleSummaryDto>('/rai/explainability/lifecycle/summary'),
        lifecycleAgents: () =>
            apiClient.get<AgentLifecycleItemDto[]>('/rai/explainability/lifecycle/agents'),
        lifecycleHistory: (params?: { limit?: number }) =>
            apiClient.get<AgentLifecycleHistoryItemDto[]>('/rai/explainability/lifecycle/history', { params: params ?? {} }),
        setLifecycleOverride: (data: { role: string; state: 'FROZEN' | 'RETIRED'; reason: string }) =>
            apiClient.post<AgentLifecycleItemDto[]>('/rai/explainability/lifecycle/override', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('lifecycle-override', [
                        data.role,
                        data.state,
                        data.reason,
                    ]),
                },
            }),
        clearLifecycleOverride: (data: { role: string }) =>
            apiClient.post<AgentLifecycleItemDto[]>('/rai/explainability/lifecycle/override/clear', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('lifecycle-override-clear', [data.role]),
                },
            }),
        costHotspots: (params?: { timeWindowMs?: number; limit?: number }) =>
            apiClient.get('/rai/explainability/cost-hotspots', { params: params ?? {} }),
        traceTimeline: (traceId: string) =>
            apiClient.get(`/rai/explainability/trace/${encodeURIComponent(traceId)}`),
        traceForensics: (traceId: string) =>
            apiClient.get<TraceForensicsResponseDto>(`/rai/explainability/trace/${encodeURIComponent(traceId)}/forensics`),
        traceTopology: (traceId: string) =>
            apiClient.get(`/rai/explainability/trace/${encodeURIComponent(traceId)}/topology`),
        replayTrace: (traceId: string) =>
            apiClient.post(`/rai/explainability/trace/${encodeURIComponent(traceId)}/replay`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('trace-replay', [traceId]),
                },
            }),
    },
    memory: {
        health: () => apiClient.get<MemoryHealthDto>('/memory/health'),
    },
    ofs: {
        financeDashboard: () => apiClient.get('/ofs/finance/dashboard'),
        strategyForecasts: {
            run: (data: StrategyForecastRunRequest) =>
                apiClient.post<StrategyForecastRunResponse>('/ofs/strategy/forecasts/run', data, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('strategy-forecast-run', [
                            data.scopeLevel,
                            data.seasonId,
                            `${data.horizonDays}`,
                            data.farmId ?? null,
                            data.fieldId ?? null,
                            data.crop ?? null,
                            serializeIdempotencyPayload(data.domains),
                            serializeIdempotencyPayload(data.scenario ?? {}),
                        ]),
                    },
                }),
            history: (params?: StrategyForecastRunHistoryQuery) =>
                apiClient.get<StrategyForecastRunHistoryResponse>('/ofs/strategy/forecasts/history', {
                    params: params ?? {},
                }),
            submitFeedback: (runId: string, data: StrategyForecastRunFeedbackRequest) =>
                apiClient.post<StrategyForecastRunHistoryItem>(
                    `/ofs/strategy/forecasts/history/${encodeURIComponent(runId)}/feedback`,
                    data,
                    {
                        headers: {
                            'Idempotency-Key': buildIdempotencyKey('strategy-forecast-feedback', [
                                runId,
                                serializeIdempotencyPayload(data),
                            ]),
                        },
                    },
                ),
            listScenarios: () =>
                apiClient.get<StrategyForecastScenarioRecord[]>('/ofs/strategy/forecasts/scenarios'),
            saveScenario: (data: StrategyForecastScenarioSaveRequest) =>
                apiClient.post<StrategyForecastScenarioRecord>('/ofs/strategy/forecasts/scenarios', data, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('strategy-forecast-scenario-save', [
                            data.name,
                            data.scopeLevel,
                            data.seasonId,
                            `${data.horizonDays}`,
                            data.farmId ?? null,
                            data.fieldId ?? null,
                            data.crop ?? null,
                            serializeIdempotencyPayload(data.domains),
                            serializeIdempotencyPayload(data.leverValues),
                        ]),
                    },
                }),
            deleteScenario: (scenarioId: string) =>
                apiClient.delete<{ ok: true }>(`/ofs/strategy/forecasts/scenarios/${encodeURIComponent(scenarioId)}`, {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('strategy-forecast-scenario-delete', [scenarioId]),
                    },
                }),
        },
    },
    experts: {
        chiefAgronomistReview: (data: ChiefAgronomistReviewRequest) =>
            apiClient.post<ChiefAgronomistReviewResponse>('/rai-chat/expert/chief-agronomist/review', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('chief-agronomist-review', [
                        data.entityType,
                        data.entityId,
                        data.fieldId ?? null,
                        data.seasonId ?? null,
                        data.planId ?? null,
                        data.traceParentId ?? null,
                        data.reason,
                    ]),
                },
            }),
        applyReviewOutcome: (reviewId: string, data: ExpertReviewOutcomeRequest) =>
            apiClient.post<ChiefAgronomistReviewResponse>(
                `/rai-chat/expert/reviews/${encodeURIComponent(reviewId)}/outcome`,
                data,
                {
                    headers: {
                        'Idempotency-Key': buildIdempotencyKey('expert-review-outcome', [
                            reviewId,
                            data.action,
                            data.note ?? null,
                        ]),
                    },
                },
            ),
    },
    seasons: {
        list: () => apiClient.get<SeasonListItem[]>('/seasons'),
        create: (data: {
            year: number;
            fieldId?: string;
            cropVarietyId?: string;
            expectedYield?: number;
            startDate?: string;
            endDate?: string;
            status?: string;
        }) =>
            apiClient.post('/seasons', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('season-create', [
                        String(data.year),
                        data.fieldId ?? null,
                        data.startDate ?? null,
                    ]),
                },
            }),
    },
    agents: {
        getConfig: () => apiClient.get<AgentConfigsResponse>('/rai/agents/config'),
        getOnboardingTemplates: () => apiClient.get<FutureAgentTemplatesResponse>('/rai/agents/onboarding/templates'),
        validateOnboardingManifest: (data: FutureAgentManifestBody) =>
            apiClient.post<FutureAgentManifestValidation>('/rai/agents/onboarding/validate', data),
        createChangeRequest: (data: UpsertAgentConfigBody, scope: 'tenant' | 'global') =>
            apiClient.post('/rai/agents/config/change-requests', data, {
                params: { scope },
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('agent-change-request', [
                        scope,
                        data.role,
                        data.llmModel,
                        serializeIdempotencyPayload(data),
                    ]),
                },
            }),
        startCanary: (changeId: string) =>
            apiClient.post<AgentConfigChangeRequestDto>(`/rai/agents/config/change-requests/${encodeURIComponent(changeId)}/canary/start`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('agent-canary-start', [changeId]),
                },
            }),
        reviewCanary: (changeId: string, data: { baselineRejectionRate: number; canaryRejectionRate: number; sampleSize: number }) =>
            apiClient.post<AgentConfigChangeRequestDto>(`/rai/agents/config/change-requests/${encodeURIComponent(changeId)}/canary/review`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('agent-canary-review', [
                        changeId,
                        `${data.baselineRejectionRate}`,
                        `${data.canaryRejectionRate}`,
                        `${data.sampleSize}`,
                    ]),
                },
            }),
        promoteChange: (changeId: string) =>
            apiClient.post<AgentConfigChangeRequestDto>(`/rai/agents/config/change-requests/${encodeURIComponent(changeId)}/promote`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('agent-promote', [changeId]),
                },
            }),
        rollbackChange: (changeId: string, reason: string) =>
            apiClient.post<AgentConfigChangeRequestDto>(`/rai/agents/config/change-requests/${encodeURIComponent(changeId)}/rollback`, { reason }, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('agent-rollback', [changeId, reason]),
                },
            }),
    },
    governance: {
        incidentsFeed: (params?: { limit?: number; offset?: number }) =>
            apiClient.get<IncidentFeedItem[]>('/rai/incidents/feed', { params: params ?? {} }),
        resolveIncident: (id: string, comment: string) =>
            apiClient.post(`/rai/incidents/${encodeURIComponent(id)}/resolve`, { comment }, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('incident-resolve', [id, comment]),
                },
            }),
        executeRunbook: (id: string, data: { action: 'REQUIRE_HUMAN_REVIEW' | 'ROLLBACK_CHANGE_REQUEST'; comment?: string }) =>
            apiClient.post(`/rai/incidents/${encodeURIComponent(id)}/runbook`, data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('incident-runbook', [
                        id,
                        data.action,
                        data.comment ?? null,
                    ]),
                },
            }),
        counters: () => apiClient.get<GovernanceCountersDto>('/rai/governance/counters'),
    },
    pendingActions: {
        list: (params?: { status?: PendingActionStatusDto; limit?: number; traceId?: string }) =>
            apiClient.get<PendingActionDto[]>('/rai/pending-actions', { params: params ?? {} }),
        approveFirst: (id: string) =>
            apiClient.post<PendingActionDto>(`/rai/pending-actions/${encodeURIComponent(id)}/approve-first`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('pending-action-approve-first', [id]),
                },
            }),
        approveFinal: (id: string) =>
            apiClient.post<PendingActionDto>(`/rai/pending-actions/${encodeURIComponent(id)}/approve-final`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('pending-action-approve-final', [id]),
                },
            }),
        execute: (id: string) =>
            apiClient.post<PendingActionDto>(`/rai/pending-actions/${encodeURIComponent(id)}/execute`, undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('pending-action-execute', [id]),
                },
            }),
        reject: (id: string, reason?: string) =>
            apiClient.post<PendingActionDto>(`/rai/pending-actions/${encodeURIComponent(id)}/reject`, { reason }, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('pending-action-reject', [id, reason ?? null]),
                },
            }),
    },
    autonomy: {
        status: () => apiClient.get<AutonomyStatusDto>('/rai/explainability/autonomy-status'),
        setOverride: (data: { level: 'TOOL_FIRST' | 'QUARANTINE'; reason: string }) =>
            apiClient.post<AutonomyStatusDto>('/rai/explainability/runtime-governance/autonomy/override', data, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('autonomy-override', [data.level, data.reason]),
                },
            }),
        clearOverride: () =>
            apiClient.post<AutonomyStatusDto>('/rai/explainability/runtime-governance/autonomy/override/clear', undefined, {
                headers: {
                    'Idempotency-Key': buildIdempotencyKey('autonomy-override-clear', ['default']),
                },
            }),
    },
}

export interface IncidentFeedItem {
    id: string;
    companyId: string | null;
    traceId: string | null;
    incidentType: string;
    severity: string;
    details: unknown;
    createdAt: string;
    resolvedAt: string | null;
    resolveComment: string | null;
}

export interface GovernanceCountersDto {
    crossTenantBreach: number;
    piiLeak: number;
    qualityBsDrift: number;
    autonomyPolicyIncidents: number;
    promptChangeRollback: number;
    openIncidents: number;
    resolvedIncidents: number;
    runbookExecutedIncidents: number;
    byType: Record<string, number>;
}

export type PendingActionStatusDto =
    | 'PENDING'
    | 'APPROVED_FIRST'
    | 'APPROVED_FINAL'
    | 'EXPIRED'
    | 'REJECTED';

export interface PendingActionDto {
    id: string;
    traceId: string;
    toolName: string;
    riskLevel: string;
    status: PendingActionStatusDto;
    requestedByUserId: string | null;
    approvedFirstBy: string | null;
    approvedFinalBy: string | null;
    createdAt: string;
    expiresAt: string;
    payloadPreview: string;
}

export interface AutonomyStatusDto {
    companyId: string;
    level: 'AUTONOMOUS' | 'TOOL_FIRST' | 'QUARANTINE';
    avgBsScorePct: number | null;
    knownTraceCount: number;
    driver: 'QUALITY_ALERT' | 'BS_AVG_AUTONOMOUS' | 'BS_AVG_TOOL_FIRST' | 'BS_AVG_QUARANTINE' | 'NO_QUALITY_DATA' | 'MANUAL_OVERRIDE';
    activeQualityAlert?: boolean;
    manualOverride?: {
        active: boolean;
        level: 'TOOL_FIRST' | 'QUARANTINE';
        reason: string;
        createdAt: string;
        createdByUserId: string | null;
    } | null;
}

export interface ExplainabilityQueuePressureDto {
    pressureState: 'IDLE' | 'STABLE' | 'PRESSURED' | 'SATURATED' | null;
    signalFresh: boolean;
    totalBacklog: number | null;
    hottestQueue: string | null;
    observedQueues: Array<{
        queueName: string;
        lastSize: number;
        avgSize: number;
        peakSize: number;
        samples: number;
        activeInstances: number;
        lastObservedAt: string | null;
    }>;
}

export interface RuntimeGovernanceRecommendationDto {
    type: string;
    reason: string;
    agentRole?: string | null;
    score?: number | null;
    traceId?: string | null;
    metadata?: Record<string, unknown>;
}

export interface RuntimeGovernanceSummaryDto {
    companyId: string;
    queuePressure: ExplainabilityQueuePressureDto;
    topFallbackReasons: Array<{
        fallbackReason: string;
        count: number;
    }>;
    recentIncidents: Array<{
        id: string;
        incidentType: string;
        severity: string;
        traceId: string | null;
        createdAt: string;
    }>;
    activeRecommendations: RuntimeGovernanceRecommendationDto[];
    quality: {
        avgBsScorePct: number | null;
        avgEvidenceCoveragePct: number | null;
        qualityAlertCount: number;
    };
    flags: {
        apiEnabled: boolean;
        uiEnabled: boolean;
        enforcementEnabled: boolean;
        autoQuarantineEnabled: boolean;
    };
    autonomy: {
        level: string;
        avgBsScorePct: number;
        knownTraceCount: number;
        driver: string | null;
        activeQualityAlert: boolean;
        manualOverride?: {
            active: boolean;
            level: string;
            reason: string;
            createdAt: string;
            createdByUserId: string | null;
        } | null;
    };
    hottestAgents: Array<{
        agentRole: string;
        fallbackRatePct: number | null;
        avgBsScorePct: number | null;
        incidentCount: number;
    }>;
}

export interface RuntimeGovernanceAgentDto {
    agentRole: string;
    executionCount: number;
    successRatePct: number | null;
    fallbackRatePct: number | null;
    budgetDeniedRatePct: number | null;
    budgetDegradedRatePct: number | null;
    policyBlockRatePct: number | null;
    needsMoreDataRatePct: number | null;
    toolFailureRatePct: number | null;
    avgLatencyMs: number | null;
    p95LatencyMs: number | null;
    avgBsScorePct: number | null;
    avgEvidenceCoveragePct: number | null;
    incidentCount: number;
    lastRecommendation: string | null;
}

export interface RuntimeGovernanceDrilldownsDto {
    flags: {
        apiEnabled: boolean;
        uiEnabled: boolean;
        enforcementEnabled: boolean;
        autoQuarantineEnabled: boolean;
    };
    fallbackHistory: Array<{
        agentRole: string;
        fallbackReason: string;
        count: number;
        lastSeenAt: string;
    }>;
    qualityDriftHistory: Array<{
        agentRole: string | null;
        traceId: string | null;
        recentAvgBsPct: number | null;
        baselineAvgBsPct: number | null;
        recommendationType: string | null;
        createdAt: string;
    }>;
    budgetHotspots: Array<{
        toolName: string;
        agentRole: string | null;
        deniedCount: number;
        degradedCount: number;
        lastSeenAt: string;
    }>;
    queueSaturationTimeline: Array<{
        observedAt: string;
        pressureState: 'IDLE' | 'STABLE' | 'PRESSURED' | 'SATURATED';
        totalBacklog: number;
        hottestQueue: string | null;
    }>;
    correlation: Array<{
        createdAt: string;
        traceId: string | null;
        agentRole: string | null;
        fallbackReason: string | null;
        recommendationType: string | null;
        incidentType: string | null;
        severity: string | null;
    }>;
}

export type AgentLifecycleStateDto =
    | 'FUTURE_ROLE'
    | 'PROMOTION_CANDIDATE'
    | 'CANARY'
    | 'CANONICAL_ACTIVE'
    | 'FROZEN'
    | 'ROLLED_BACK'
    | 'RETIRED';

export interface AgentLifecycleSummaryDto {
    companyId: string;
    templateCatalogCount: number;
    totalTrackedRoles: number;
    stateCounts: Record<AgentLifecycleStateDto, number>;
    activeCanaries: Array<{
        role: string;
        targetVersion: string;
        changeRequestId: string;
    }>;
    degradedCanaries: Array<{
        role: string;
        targetVersion: string;
        changeRequestId: string;
    }>;
    promotionCandidates: Array<{
        role: string;
        targetVersion: string;
        status: string;
    }>;
    rolledBackRoles: Array<{
        role: string;
        targetVersion: string;
        rolledBackAt: string | null;
    }>;
}

export interface AgentLifecycleItemDto {
    role: string;
    agentName: string;
    ownerDomain: string;
    class: 'canonical' | 'future_role';
    lifecycleState: AgentLifecycleStateDto;
    runtimeActive: boolean;
    tenantAccessMode: 'INHERITED' | 'OVERRIDE' | 'DENIED' | 'UNKNOWN';
    effectiveConfigId: string | null;
    candidateVersion: string | null;
    latestChangeRequestId: string | null;
    changeRequestStatus: string | null;
    canaryStatus: string | null;
    rollbackStatus: string | null;
    productionDecision: string | null;
    currentVersion: string | null;
    stableVersion: string | null;
    previousStableVersion: string | null;
    versionDelta: 'MATCHES_STABLE' | 'AHEAD_OF_STABLE' | 'ROLLED_BACK_TO_STABLE' | 'UNKNOWN';
    promotedAt: string | null;
    rolledBackAt: string | null;
    updatedAt: string | null;
    lifecycleOverride: {
        state: 'FROZEN' | 'RETIRED';
        reason: string;
        createdAt: string;
        createdByUserId: string | null;
    } | null;
    lineage: Array<{
        changeRequestId: string;
        targetVersion: string;
        status: string;
        canaryStatus: string;
        rollbackStatus: string;
        createdAt: string;
        promotedAt: string | null;
        rolledBackAt: string | null;
    }>;
    notes: string[];
}

export interface AgentLifecycleHistoryItemDto {
    role: string;
    state: 'FROZEN' | 'RETIRED';
    reason: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    clearedAt: string | null;
    createdByUserId: string | null;
    clearedByUserId: string | null;
}

export interface AgentConfigChangeRequestDto {
    id: string;
    role: string;
    scope: 'GLOBAL' | 'TENANT';
    targetVersion: string;
    status: 'EVAL_FAILED' | 'READY_FOR_CANARY' | 'CANARY_ACTIVE' | 'APPROVED_FOR_PRODUCTION' | 'PROMOTED' | 'ROLLED_BACK';
    evalVerdict: string | null;
    canaryStatus: 'NOT_STARTED' | 'ACTIVE' | 'PASSED' | 'DEGRADED';
    rollbackStatus: 'NOT_REQUIRED' | 'EXECUTED';
    productionDecision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ROLLED_BACK';
    requestedConfig: unknown;
    promotedAt: string | null;
    rolledBackAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AgentConfigItem {
    id: string;
    name: string;
    role: string;
    systemPrompt: string;
    llmModel: string;
    maxTokens: number;
    isActive: boolean;
    companyId: string | null;
    capabilities: string[];
    createdAt: string;
    updatedAt: string;
}

export interface AgentRegistryRuntimeItem {
    configId: string | null;
    source: 'global' | 'tenant';
    bindingsSource: 'persisted' | 'bootstrap';
    llmModel: string;
    maxTokens: number;
    systemPrompt: string;
    capabilities: string[];
    tools: string[];
    isActive: boolean;
}

export interface AgentTenantAccessItem {
    companyId: string;
    mode: 'INHERITED' | 'OVERRIDE' | 'DENIED';
    source: 'global' | 'tenant';
    isActive: boolean;
}

export interface AgentConfiguratorItem {
    role: string;
    agentName: string;
    businessRole: string;
    ownerDomain: string;
    runtime: AgentRegistryRuntimeItem;
    tenantAccess: AgentTenantAccessItem;
    memoryPolicy?: Record<string, unknown>;
    outputContract?: Record<string, unknown>;
    governancePolicy?: Record<string, unknown>;
    kernel?: {
        runtimeProfile: {
            profileId: string;
            modelRoutingClass: 'cheap' | 'fast' | 'strong';
            provider: 'openrouter';
            model: string;
            executionAdapterRole?: string;
            maxInputTokens: number;
            maxOutputTokens: number;
            temperature: number;
            timeoutMs: number;
            supportsStreaming: boolean;
        };
    };
}

export interface TraceForensicsMemoryLaneItemDto {
    kind: string;
    label: string;
    confidence: number;
}

export interface TraceForensicsMemoryLaneDroppedItemDto {
    kind: string;
    label: string;
    reason: string;
}

export interface TraceForensicsMemoryLaneDto {
    recalled: TraceForensicsMemoryLaneItemDto[];
    used: TraceForensicsMemoryLaneItemDto[];
    dropped: TraceForensicsMemoryLaneDroppedItemDto[];
    escalationReason?: string;
}

export type BranchVerdict =
    | 'VERIFIED'
    | 'PARTIAL'
    | 'UNVERIFIED'
    | 'CONFLICTED'
    | 'REJECTED';

export type UserFacingTrustTone = 'critical' | 'warning' | 'info';

export interface UserFacingTrustSummaryBranchDto {
    branchId: string;
    sourceAgent: string;
    verdict: BranchVerdict;
    label: string;
    summary?: string;
    disclosure: string[];
}

export interface UserFacingTrustSummaryDto {
    verdict: BranchVerdict;
    label: string;
    tone: UserFacingTrustTone;
    summary: string;
    disclosure: string[];
    branchCount: number;
    verifiedCount: number;
    partialCount: number;
    unverifiedCount: number;
    conflictedCount: number;
    rejectedCount: number;
    crossCheckCount: number;
    branches: UserFacingTrustSummaryBranchDto[];
}

export interface RaiChatMemoryUsedDto {
    kind: 'episode' | 'profile' | 'engram' | 'active_alert' | 'hot_engram';
    label: string;
    confidence: number;
    source?: string;
}

export interface RaiChatMemorySummaryDto {
    primaryHint: string;
    primaryKind: 'episode' | 'profile' | 'engram' | 'active_alert' | 'hot_engram';
    detailsAvailable: boolean;
}

export interface RaiChatSuggestedActionDto {
    kind: 'tool' | 'route' | 'expert_review';
    title: string;
    toolName?: string;
    payload?: Record<string, unknown>;
    href?: string;
    expertRole?: string;
}

export interface RaiChatPendingClarificationItemDto {
    key?: string;
    label?: string;
    required?: boolean;
    reason?: string;
    sourcePriority?: Array<'workspace' | 'record' | 'user'>;
    status?: 'missing' | 'resolved';
    resolvedFrom?: 'workspace' | 'record' | 'user';
    value?: string;
}

export interface RaiChatPendingClarificationDto {
    kind?: 'missing_context';
    agentRole?: string;
    intentId?: string;
    summary?: string;
    autoResume?: boolean;
    items?: RaiChatPendingClarificationItemDto[];
}

export interface RaiChatResponseDto {
    text?: string;
    threadId?: string;
    riskLevel?: 'R0' | 'R1' | 'R2' | 'R3' | 'R4';
    widgets?: RaiChatWidget[];
    memoryUsed?: RaiChatMemoryUsedDto[];
    memorySummary?: RaiChatMemorySummaryDto;
    suggestedActions?: RaiChatSuggestedActionDto[];
    agentRole?: string;
    activeWindowId?: string | null;
    pendingClarification?: RaiChatPendingClarificationDto | null;
    workWindows?: AiWorkWindow[];
    branchResults?: TraceForensicsBranchResultDto[];
    branchTrustAssessments?: TraceForensicsBranchTrustAssessmentDto[];
    branchCompositions?: TraceForensicsBranchCompositionDto[];
    trustSummary?: UserFacingTrustSummaryDto;
}

export interface RaiChatClarificationResumeDto {
    windowId: string;
    intentId: 'tech_map_draft' | 'compute_plan_fact' | 'multi_source_aggregation';
    agentRole: 'agronomist' | 'economist';
    collectedContext: {
        fieldRef?: string;
        seasonRef?: string;
        seasonId?: string;
        planId?: string;
    };
}

export interface RaiChatSubmitRequestDto {
    threadId: string | null;
    message: string;
    workspaceContext: WorkspaceContext;
    originMessageId?: string | null;
    clarificationResume?: RaiChatClarificationResumeDto;
    signal?: AbortSignal;
}

export async function submitRaiChatRequest(
    params: RaiChatSubmitRequestDto,
): Promise<RaiChatResponseDto> {
    const idempotencyKey = buildIdempotencyKey('rai-chat-submit', [
        params.threadId ?? null,
        params.message,
        params.originMessageId ?? null,
        params.clarificationResume?.windowId ?? null,
        serializeIdempotencyPayload(params.workspaceContext ?? {}),
    ]);

    const response = await fetch('/api/rai/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
            threadId: params.threadId,
            message: params.message,
            workspaceContext: params.workspaceContext,
            clarificationResume: params.clarificationResume,
        }),
        signal: params.signal,
    });

    if (!response.ok) {
        throw new Error(await getRaiChatHttpErrorMessage(response));
    }

    return response.json() as Promise<RaiChatResponseDto>;
}

export interface BranchTrustDashboardDto {
    knownTraceCount: number;
    pendingTraceCount: number;
    verifiedBranchCount: number;
    partialBranchCount: number;
    unverifiedBranchCount: number;
    conflictedBranchCount: number;
    rejectedBranchCount: number;
    crossCheckTraceCount: number;
    withinBudgetTraceCount: number;
    overBudgetTraceCount: number;
    withinBudgetRate: number | null;
    avgLatencyMs: number | null;
    p95LatencyMs: number | null;
}

export interface TruthfulnessDashboardDto {
    companyId: string;
    avgBsScore: number | null;
    p95BsScore: number | null;
    avgEvidenceCoverage: number | null;
    acceptanceRate: number | null;
    correctionRate: number | null;
    worstTraces: Array<{
        traceId: string;
        bsScorePct: number | null;
        evidenceCoveragePct: number | null;
        invalidClaimsPct?: number | null;
        createdAt: string;
    }>;
    qualityKnownTraceCount: number;
    qualityPendingTraceCount: number;
    branchTrust: BranchTrustDashboardDto;
    criticalPath: Array<{
        traceId: string;
        phase: string;
        durationMs: number;
        totalDurationMs: number | null;
        createdAt: string;
    }>;
}

export interface TraceForensicsEvidenceRefDto {
    claim: string;
    sourceType: string;
    sourceId: string;
    confidenceScore: number;
}

export interface TraceForensicsSummaryDto {
    traceId: string;
    companyId: string;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
    modelId: string;
    promptVersion: string;
    toolsVersion: string;
    policyId: string;
    bsScorePct: number | null;
    evidenceCoveragePct: number | null;
    invalidClaimsPct: number | null;
    verifiedBranchCount: number | null;
    partialBranchCount: number | null;
    unverifiedBranchCount: number | null;
    conflictedBranchCount: number | null;
    rejectedBranchCount: number | null;
    trustGateLatencyMs: number | null;
    trustLatencyProfile: string | null;
    trustLatencyBudgetMs: number | null;
    trustLatencyWithinBudget: boolean | null;
    createdAt: string;
}

export interface TraceForensicsEntryDto {
    id: string;
    traceId: string;
    companyId: string;
    toolNames: string[];
    model: string;
    intentMethod: string | null;
    phase: string;
    kind?: string;
    label?: string;
    durationMs?: number;
    tokensUsed: number;
    createdAt: string;
    evidenceRefs: TraceForensicsEvidenceRefDto[];
}

export interface TraceForensicsAlertDto {
    id: string;
    alertType: string;
    severity: string;
    message: string;
    createdAt: string;
}

export interface TraceForensicsBranchResultDto {
    branch_id: string;
    source_agent: string;
    domain: string;
    summary?: string;
    scope: Record<string, unknown>;
    facts?: Record<string, unknown>;
    metrics?: Record<string, unknown>;
    money?: Record<string, unknown>;
    derived_from: Array<{
        kind: string;
        source_id: string;
        label?: string;
        field_path?: string;
    }>;
    evidence_refs: TraceForensicsEvidenceRefDto[];
    assumptions: string[];
    data_gaps: string[];
    freshness: {
        status: string;
        checked_at?: string;
        observed_at?: string;
        expires_at?: string;
    };
    confidence: number;
}

export interface TraceForensicsBranchTrustAssessmentDto {
    branch_id: string;
    source_agent: string;
    verdict: BranchVerdict;
    score: number;
    reasons: string[];
    checks: Array<{
        name: string;
        status: string;
        details?: string;
    }>;
    requires_cross_check: boolean;
}

export interface TraceForensicsBranchCompositionDto {
    branch_id: string;
    verdict: BranchVerdict;
    include_in_response: boolean;
    summary?: string;
    disclosure: string[];
}

export interface TraceForensicsBranchTrustDto {
    branchResults: TraceForensicsBranchResultDto[];
    branchTrustAssessments: TraceForensicsBranchTrustAssessmentDto[];
    branchCompositions: TraceForensicsBranchCompositionDto[];
}

export interface TraceForensicsSemanticIngressDomainCandidateDto {
    domain: string;
    ownerRole: string | null;
    score: number;
    source: 'legacy' | 'semantic';
    reason: string;
}

export interface TraceForensicsSemanticIngressEntityDto {
    kind: 'semantic_entity' | 'workspace_route' | 'workspace_selection' | 'active_entity' | 'inn';
    value: string;
    source: 'semantic' | 'workspace' | 'message' | 'tool_payload';
}

export interface TraceForensicsCompositeWorkflowStageDto {
    stageId: string;
    order: number;
    agentRole: string;
    intent: string;
    toolName: string;
    label: string;
    dependsOn: string[];
    status: 'planned' | 'completed' | 'failed' | 'blocked';
    summary?: string;
}

export interface TraceForensicsCompositeWorkflowPlanDto {
    planId: string;
    workflowId: string;
    leadOwnerAgent: string;
    executionStrategy: 'sequential' | 'parallel' | 'blocking';
    summary: string;
    stages: TraceForensicsCompositeWorkflowStageDto[];
}

export interface TraceForensicsSemanticIngressFrameDto {
    version: 'v1';
    interactionMode: 'free_chat' | 'information_request' | 'task_request' | 'workflow_resume';
    requestShape: 'single_intent' | 'clarification_resume' | 'composite' | 'unknown';
    domainCandidates: TraceForensicsSemanticIngressDomainCandidateDto[];
    goal: string | null;
    entities: TraceForensicsSemanticIngressEntityDto[];
    requestedOperation: {
        ownerRole: string | null;
        intent: string | null;
        toolName: string | null;
        decisionType: string;
        source: 'clarification_resume' | 'explicit_tool_call' | 'legacy_contracts' | 'semantic_router_primary' | 'semantic_router_shadow';
    };
    operationAuthority: 'direct_user_command' | 'workflow_resume' | 'delegated_or_autonomous' | 'unknown';
    missingSlots: string[];
    riskClass: 'safe_read' | 'write_candidate' | 'high_risk_write' | 'unknown';
    requiresConfirmation: boolean;
    confidenceBand: 'high' | 'medium' | 'low';
    explanation: string;
    proofSliceId?: string | null;
    compositePlan?: TraceForensicsCompositeWorkflowPlanDto | null;
}

export interface TraceForensicsResponseDto {
    traceId: string;
    companyId: string;
    summary: TraceForensicsSummaryDto | null;
    timeline: TraceForensicsEntryDto[];
    qualityAlerts: TraceForensicsAlertDto[];
    memoryLane?: TraceForensicsMemoryLaneDto | null;
    branchTrust?: TraceForensicsBranchTrustDto | null;
    semanticIngressFrame?: TraceForensicsSemanticIngressFrameDto | null;
}

export interface MemoryHealthDto {
    status: 'ok' | 'degraded';
    degraded: boolean;
    layers: Record<string, unknown>;
    recallLatencyMs: number | null;
    episodeCount: number | null;
    engramCount: number | null;
    hotAlertCount: number | null;
    consolidationFreshness: number | null;
    pruningStatus: string;
    trustScore: number | null;
    timestamp: string;
    error?: string;
}

export interface StrategyForecastRunRequest {
    scopeLevel: 'company' | 'farm' | 'field';
    seasonId: string;
    horizonDays: 30 | 90 | 180 | 365;
    farmId?: string;
    fieldId?: string;
    crop?: string;
    domains: Array<'agro' | 'economics' | 'finance' | 'risk'>;
    scenario?: {
        name: string;
        adjustments: Array<{
            lever:
                | 'yield_pct'
                | 'sales_price_pct'
                | 'input_cost_pct'
                | 'opex_pct'
                | 'working_capital_days'
                | 'disease_risk_pct';
            operator: 'delta';
            value: number;
        }>;
    };
}

export interface StrategyForecastScenarioRecord {
    id: string;
    name: string;
    scopeLevel: 'company' | 'farm' | 'field';
    seasonId: string;
    horizonDays: 30 | 90 | 180 | 365;
    farmId: string;
    fieldId: string;
    crop: string;
    domains: Array<'agro' | 'economics' | 'finance' | 'risk'>;
    leverValues: Record<
        | 'yield_pct'
        | 'sales_price_pct'
        | 'input_cost_pct'
        | 'opex_pct'
        | 'working_capital_days'
        | 'disease_risk_pct',
        string
    >;
    createdByUserId?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface StrategyForecastScenarioSaveRequest {
    name: string;
    scopeLevel: 'company' | 'farm' | 'field';
    seasonId: string;
    horizonDays: 30 | 90 | 180 | 365;
    farmId?: string;
    fieldId?: string;
    crop?: string;
    domains: Array<'agro' | 'economics' | 'finance' | 'risk'>;
    leverValues: Partial<Record<
        | 'yield_pct'
        | 'sales_price_pct'
        | 'input_cost_pct'
        | 'opex_pct'
        | 'working_capital_days'
        | 'disease_risk_pct',
        string
    >>;
}

export interface StrategyForecastRunResponse {
    traceId: string;
    degraded: boolean;
    degradationReasons: string[];
    lineage: Array<{
        source: string;
        status: 'ok' | 'degraded' | 'not_requested' | 'missing';
        detail: string;
    }>;
    baseline: {
        revenue: number;
        margin: number;
        cashFlow: number;
        yield?: number;
        riskScore: number;
    };
    range: {
        revenue: { p10: number; p50: number; p90: number };
        margin: { p10: number; p50: number; p90: number };
        cashFlow: { p10: number; p50: number; p90: number };
        yield?: { p10: number; p50: number; p90: number };
    };
    scenarioDelta?: {
        revenue: number;
        margin: number;
        cashFlow: number;
        yield?: number;
        riskScore: number;
    };
    drivers: Array<{ name: string; direction: 'up' | 'down'; strength: number }>;
    recommendedAction: string;
    tradeoff: string;
    limitations: string[];
    evidence: string[];
    riskTier: 'low' | 'medium' | 'high';
    optimizationPreview: {
        objective: string;
        planningHorizon: string;
        constraints: string[];
        recommendations: Array<{
            action: string;
            expectedImpact: string;
            confidence: 'high' | 'medium' | 'low';
        }>;
    };
}

export interface StrategyForecastRunHistoryItem {
    id: string;
    traceId: string;
    scopeLevel: 'company' | 'farm' | 'field';
    seasonId: string;
    horizonDays: 30 | 90 | 180 | 365;
    domains: Array<'agro' | 'economics' | 'finance' | 'risk'>;
    degraded: boolean;
    riskTier: 'low' | 'medium' | 'high';
    recommendedAction: string;
    scenarioName?: string | null;
    createdByUserId?: string | null;
    createdAt: string;
    evaluation: {
        status: 'pending' | 'feedback_recorded';
        revenueErrorPct?: number | null;
        marginErrorPct?: number | null;
        cashFlowErrorPct?: number | null;
        yieldErrorPct?: number | null;
        note?: string | null;
        feedbackAt?: string | null;
    };
}

export interface StrategyForecastRunHistoryQuery {
    limit?: number;
    offset?: number;
    seasonId?: string;
    riskTier?: 'low' | 'medium' | 'high';
    degraded?: boolean;
}

export interface StrategyForecastRunHistoryResponse {
    items: StrategyForecastRunHistoryItem[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface StrategyForecastRunFeedbackRequest {
    actualRevenue?: number;
    actualMargin?: number;
    actualCashFlow?: number;
    actualYield?: number;
    note?: string;
}

export interface SeasonListItem {
    id: string;
    year: number;
    status: string;
    fieldId?: string | null;
}

export interface ChiefAgronomistReviewRequest {
    entityType: 'techmap' | 'deviation' | 'field';
    entityId: string;
    reason: string;
    fieldId?: string;
    seasonId?: string;
    planId?: string;
    workspaceRoute?: string;
    traceParentId?: string;
}

export interface ChiefAgronomistReviewResponse {
    reviewId: string;
    traceId: string;
    verdict: string;
    actionsNow: string[];
    alternatives: string[];
    basedOn: string[];
    evidence: Array<{
        claim: string;
        sourceType: 'TOOL_RESULT' | 'DB' | 'DOC';
        sourceId: string;
        confidenceScore: number;
    }>;
    riskTier: 'low' | 'medium' | 'high';
    requiresHumanDecision: boolean;
    status: 'completed' | 'needs_more_context' | 'degraded';
    missingContext?: string[];
    outcomeAction?: 'accept' | 'hand_off' | 'create_task';
    outcomeNote?: string | null;
    resolvedAt?: string | null;
    createdTaskId?: string;
}

export interface ExpertReviewOutcomeRequest {
    action: 'accept' | 'hand_off' | 'create_task';
    note?: string;
}

export interface AgentConfigsResponse {
    global: AgentConfigItem[];
    tenantOverrides: AgentConfigItem[];
    agents: AgentConfiguratorItem[];
}

export interface UpsertAgentConfigBody {
    name: string;
    role: string;
    systemPrompt: string;
    llmModel: string;
    maxTokens: number;
    runtimeProfile?: {
        executionAdapterRole?: string;
    };
    responsibilityBinding?: {
        role: string;
        inheritsFromRole: 'agronomist' | 'economist' | 'knowledge' | 'monitoring' | 'crm_agent' | 'front_office_agent' | 'contracts_agent' | 'chief_agronomist' | 'data_scientist';
        overrides?: {
            title?: string;
            allowedIntents?: string[];
            forbiddenIntents?: string[];
            extraUiActions?: string[];
        };
    };
    isActive?: boolean;
    capabilities?: string[];
    tools?: string[];
}

export interface FutureAgentManifestBody {
    templateId?: 'marketer' | 'strategist' | 'finance_advisor' | 'legal_advisor' | 'crm_agent' | 'front_office_agent' | 'contracts_agent' | 'controller' | 'personal_assistant';
    role: string;
    name: string;
    kind: 'domain_advisor' | 'worker_hybrid' | 'personal_delegated';
    ownerDomain: string;
    description: string;
    defaultAutonomyMode: 'advisory' | 'hybrid' | 'autonomous';
    runtimeProfile: {
        profileId: string;
        modelRoutingClass: 'cheap' | 'fast' | 'strong';
        provider: 'openrouter';
        model: string;
        executionAdapterRole?: string;
        maxInputTokens: number;
        maxOutputTokens: number;
        temperature: number;
        timeoutMs: number;
        supportsStreaming: boolean;
    };
    responsibilityBinding?: {
        role: string;
        inheritsFromRole: 'agronomist' | 'economist' | 'knowledge' | 'monitoring' | 'crm_agent' | 'front_office_agent' | 'contracts_agent' | 'chief_agronomist' | 'data_scientist';
        overrides?: {
            title?: string;
            allowedIntents?: string[];
            forbiddenIntents?: string[];
            extraUiActions?: string[];
        };
    };
    memoryPolicy: {
        policyId: string;
        allowedScopes: Array<'tenant' | 'domain' | 'user' | 'team' | 'task_workflow' | 'sensitive_compliance'>;
        retrievalPolicy: string;
        writePolicy: string;
        sensitiveDataPolicy: string;
    };
    capabilityPolicy: {
        capabilities: string[];
        toolAccessMode: 'allowlist';
        connectorAccessMode: 'allowlist';
    };
    toolBindings: Array<{
        toolName: string;
        isEnabled: boolean;
        requiresHumanGate: boolean;
        riskLevel: 'READ' | 'WRITE' | 'CRITICAL';
    }>;
    connectorBindings: Array<{
        connectorName: string;
        accessMode: 'read' | 'write' | 'governed_write';
        scopes: string[];
    }>;
    outputContract: {
        contractId: string;
        responseSchemaVersion: string;
        sections: string[];
        requiresEvidence: boolean;
        requiresDeterministicValidation: boolean;
        fallbackMode: string;
    };
    governancePolicy: {
        policyId: string;
        allowedAutonomyModes: Array<'advisory' | 'hybrid' | 'autonomous'>;
        humanGateRules: string[];
        criticalActionRules: string[];
        auditRequirements: string[];
        fallbackRules: string[];
    };
    domainAdapter?: {
        adapterId: string;
        status: 'optional' | 'required';
        notes: string;
    };
}

export interface FutureAgentTemplateItem {
    templateId: 'marketer' | 'strategist' | 'finance_advisor' | 'legal_advisor' | 'crm_agent' | 'front_office_agent' | 'contracts_agent' | 'controller' | 'personal_assistant';
    label: string;
    manifest: FutureAgentManifestBody;
    rolloutChecklist: string[];
}

export interface FutureAgentTemplatesResponse {
    templates: FutureAgentTemplateItem[];
}

export interface FutureAgentManifestValidation {
    valid: boolean;
    normalizedRole: string;
    compatibleWithRuntimeWithoutCodeChanges: boolean;
    missingRequirements: string[];
    warnings: string[];
}
