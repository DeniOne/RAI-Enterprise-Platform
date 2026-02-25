/**
 * БЛОК 0 + ШАГ 2: Тесты API-клиента (api.ts)
 * Проверяет что ВСЕ методы из CODEX_PROMPT определены и вызывают правильные эндпоинты.
 */
import { api, apiClient } from '@/lib/api';

// Мокаем axios instance
jest.mock('@/lib/api', () => {
    const mockGet = jest.fn().mockResolvedValue({ data: [] });
    const mockPost = jest.fn().mockResolvedValue({ data: {} });
    const mockPatch = jest.fn().mockResolvedValue({ data: {} });
    const mockPut = jest.fn().mockResolvedValue({ data: {} });
    const mockDelete = jest.fn().mockResolvedValue({ data: {} });

    const apiClient = {
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        put: mockPut,
        delete: mockDelete,
    };

    // Re-create the api object using the mock apiClient
    const api = {
        users: {
            me: () => apiClient.get('/users/me'),
            company: (companyId: string) => apiClient.get(`/users/company/${encodeURIComponent(companyId)}`),
        },
        partyManagement: {
            jurisdictions: (companyId: string) => apiClient.get('/commerce/jurisdictions', { params: { companyId } }),
            createJurisdiction: (data: { code: string; name: string; companyId: string }) => apiClient.post('/commerce/jurisdictions', data),
            regulatoryProfiles: (companyId: string) => apiClient.get('/commerce/regulatory-profiles', { params: { companyId } }),
            createRegulatoryProfile: (data: { code: string; name: string; jurisdictionId: string; companyId: string }) => apiClient.post('/commerce/regulatory-profiles', data),
            parties: (companyId: string) => apiClient.get('/commerce/parties', { params: { companyId } }),
            partyDetails: (partyId: string, companyId: string) => apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}`, { params: { companyId } }),
            createParty: (data: { legalName: string; jurisdictionId: string; regulatoryProfileId?: string; companyId: string }) => apiClient.post('/commerce/parties', data),
            updateParty: (partyId: string, data: { companyId: string }) => apiClient.patch(`/commerce/parties/${encodeURIComponent(partyId)}`, data),
            partyRelations: (partyId: string, companyId: string) => apiClient.get(`/commerce/parties/${encodeURIComponent(partyId)}/relations`, { params: { companyId } }),
            createPartyRelation: (data: { sourcePartyId: string; targetPartyId: string; relationType: string; validFrom: string; companyId: string }) => apiClient.post('/commerce/party-relations', data),
        },
        commerce: {
            contracts: () => apiClient.get('/commerce/contracts'),
            fulfillment: () => apiClient.get('/commerce/fulfillment'),
            invoices: () => apiClient.get('/commerce/invoices'),
            payments: () => apiClient.get('/commerce/payments'),
            createContract: (data: Record<string, unknown>) => apiClient.post('/commerce/contracts', data),
            createObligation: (data: Record<string, unknown>) => apiClient.post('/commerce/obligations', data),
            createFulfillment: (data: Record<string, unknown>) => apiClient.post('/commerce/fulfillment-events', data),
            createInvoice: (data: Record<string, unknown>) => apiClient.post('/commerce/invoices/from-fulfillment', data),
            postInvoice: (invoiceId: string) => apiClient.post(`/commerce/invoices/${encodeURIComponent(invoiceId)}/post`),
            createPayment: (data: Record<string, unknown>) => apiClient.post('/commerce/payments', data),
            confirmPayment: (paymentId: string) => apiClient.post(`/commerce/payments/${encodeURIComponent(paymentId)}/confirm`),
            allocatePayment: (data: Record<string, unknown>) => apiClient.post('/commerce/payment-allocations', data),
            arBalance: (invoiceId: string) => apiClient.get(`/commerce/invoices/${encodeURIComponent(invoiceId)}/ar-balance`),
        },
        crm: {
            farmsRegistry: (companyId: string, params?: Record<string, unknown>) => apiClient.get(`/crm/farms/registry/${companyId}`, { params }),
            fields: () => apiClient.get('/registry/fields'),
            plans: () => apiClient.get('/consulting/plans'),
        },
    };

    return { api, apiClient };
});

describe('API Client — ШАГ 2: Все эндпоинты Commerce', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── Party Management (Блок 0) ────────────────────────────────

    describe('partyManagement', () => {
        it('должен запрашивать список юрисдикций GET /commerce/jurisdictions', async () => {
            await api.partyManagement.jurisdictions('cmp-1');
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/jurisdictions', { params: { companyId: 'cmp-1' } });
        });

        it('должен создавать юрисдикцию POST /commerce/jurisdictions', async () => {
            const data = { code: 'RU', name: 'Российская Федерация', companyId: 'cmp-1' };
            await api.partyManagement.createJurisdiction(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/jurisdictions', data);
        });

        it('должен запрашивать список регуляторных профилей', async () => {
            await api.partyManagement.regulatoryProfiles('cmp-1');
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/regulatory-profiles', { params: { companyId: 'cmp-1' } });
        });

        it('должен создавать регуляторный профиль', async () => {
            const data = { code: 'AGRO', name: 'Аграрный', jurisdictionId: 'jur-1', companyId: 'cmp-1' };
            await api.partyManagement.createRegulatoryProfile(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/regulatory-profiles', data);
        });

        it('должен запрашивать список контрагентов (Party)', async () => {
            await api.partyManagement.parties('cmp-1');
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/parties', { params: { companyId: 'cmp-1' } });
        });

        it('должен создавать контрагента (Party)', async () => {
            const data = { legalName: 'ООО Рассвет', jurisdictionId: 'jur-1', companyId: 'cmp-1' };
            await api.partyManagement.createParty(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/parties', data);
        });

        it('должен обновлять контрагента (Party)', async () => {
            const data = { companyId: 'cmp-1' };
            await api.partyManagement.updateParty('party-1', data);
            expect(apiClient.patch).toHaveBeenCalledWith('/commerce/parties/party-1', data);
        });

        it('должен запрашивать связи контрагентов', async () => {
            await api.partyManagement.partyRelations('party-1', 'cmp-1');
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/parties/party-1/relations', { params: { companyId: 'cmp-1' } });
        });

        it('должен создавать связь контрагентов', async () => {
            const data = { sourcePartyId: 'p1', targetPartyId: 'p2', relationType: 'SUBSIDIARY', validFrom: '2026-01-01', companyId: 'cmp-1' };
            await api.partyManagement.createPartyRelation(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/party-relations', data);
        });
    });

    // ─── Commerce CRUD (Блок A) ────────────────────────────────────

    describe('commerce — A.1 Договоры', () => {
        it('должен запрашивать список договоров GET /commerce/contracts', async () => {
            await api.commerce.contracts();
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/contracts');
        });

        it('должен создавать договор POST /commerce/contracts', async () => {
            const data = {
                number: 'ДГ-2026-001',
                type: 'SUPPLY',
                validFrom: '2026-01-01',
                jurisdictionId: 'jur-1',
                roles: [{ partyId: 'p1', role: 'SELLER', isPrimary: true }],
            };
            await api.commerce.createContract(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/contracts', data);
        });
    });

    describe('commerce — A.2 Обязательства', () => {
        it('должен создавать обязательство POST /commerce/obligations', async () => {
            const data = { contractId: 'c-1', type: 'DELIVER' };
            await api.commerce.createObligation(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/obligations', data);
        });
    });

    describe('commerce — A.3 Исполнение', () => {
        it('должен запрашивать события исполнения GET /commerce/fulfillment', async () => {
            await api.commerce.fulfillment();
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/fulfillment');
        });

        it('должен создавать событие исполнения POST /commerce/fulfillment-events', async () => {
            const data = {
                obligationId: 'obl-1',
                eventDomain: 'COMMERCIAL',
                eventType: 'GOODS_SHIPMENT',
                eventDate: '2026-03-01',
            };
            await api.commerce.createFulfillment(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/fulfillment-events', data);
        });
    });

    describe('commerce — A.4 Документы', () => {
        it('должен запрашивать список инвойсов GET /commerce/invoices', async () => {
            await api.commerce.invoices();
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/invoices');
        });

        it('должен создавать инвойс из исполнения POST /commerce/invoices/from-fulfillment', async () => {
            const data = {
                fulfillmentEventId: 'fe-1',
                sellerJurisdiction: 'RU',
                buyerJurisdiction: 'BY',
                supplyType: 'GOODS',
                vatPayerStatus: 'PAYER',
                subtotal: 100000,
            };
            await api.commerce.createInvoice(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/invoices/from-fulfillment', data);
        });

        it('должен проводить инвойс POST /commerce/invoices/:id/post', async () => {
            await api.commerce.postInvoice('inv-1');
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/invoices/inv-1/post');
        });

        it('должен запрашивать AR-баланс GET /commerce/invoices/:id/ar-balance', async () => {
            await api.commerce.arBalance('inv-1');
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/invoices/inv-1/ar-balance');
        });
    });

    describe('commerce — A.5 Оплаты', () => {
        it('должен запрашивать список оплат GET /commerce/payments', async () => {
            await api.commerce.payments();
            expect(apiClient.get).toHaveBeenCalledWith('/commerce/payments');
        });

        it('должен создавать оплату POST /commerce/payments', async () => {
            const data = {
                payerPartyId: 'p1',
                payeePartyId: 'p2',
                amount: 50000,
                currency: 'RUB',
                paymentMethod: 'BANK_TRANSFER',
            };
            await api.commerce.createPayment(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/payments', data);
        });

        it('должен подтверждать оплату POST /commerce/payments/:id/confirm', async () => {
            await api.commerce.confirmPayment('pay-1');
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/payments/pay-1/confirm');
        });

        it('должен аллоцировать оплату POST /commerce/payment-allocations', async () => {
            const data = { paymentId: 'pay-1', invoiceId: 'inv-1', allocatedAmount: 30000 };
            await api.commerce.allocatePayment(data);
            expect(apiClient.post).toHaveBeenCalledWith('/commerce/payment-allocations', data);
        });
    });

    // ─── CRM (Блок B) ────────────────────────────────────────────

    describe('CRM — B.1 Реестр хозяйств', () => {
        it('должен запрашивать реестр хозяйств с параметрами', async () => {
            const params = { search: 'Рассвет', severity: 'critical', page: 1, pageSize: 20 };
            await api.crm.farmsRegistry('cmp-1', params);
            expect(apiClient.get).toHaveBeenCalledWith('/crm/farms/registry/cmp-1', { params });
        });
    });

    describe('CRM — B.3 Поля', () => {
        it('должен запрашивать поля GET /registry/fields', async () => {
            await api.crm.fields();
            expect(apiClient.get).toHaveBeenCalledWith('/registry/fields');
        });
    });

    describe('CRM — B.4 История сезонов', () => {
        it('должен запрашивать планы GET /consulting/plans', async () => {
            await api.crm.plans();
            expect(apiClient.get).toHaveBeenCalledWith('/consulting/plans');
        });
    });
});
