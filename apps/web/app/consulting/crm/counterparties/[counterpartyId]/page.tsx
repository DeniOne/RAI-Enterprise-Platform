'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { api } from '@/lib/api';

type UserOption = { id: string; name?: string; email?: string; role?: string };

type WorkspacePayload = {
    account: {
        id: string;
        name?: string | null;
        inn?: string | null;
        type?: string | null;
        status?: string | null;
        riskCategory?: string | null;
        strategicValue?: string | null;
        jurisdiction?: string | null;
        holdingId?: string | null;
    };
    legalEntities: Array<{ id: string; name?: string | null; inn?: string | null; status?: string | null; type?: string | null; riskCategory?: string | null }>;
    contacts: Array<{ id: string; firstName: string; lastName?: string | null; role?: string | null; influenceLevel?: number | null; email?: string | null; phone?: string | null; source?: string | null }>;
    interactions: Array<{ id: string; date?: string | null; summary?: string | null; type?: string | null; contactId?: string | null }>;
    obligations: Array<{ id: string; description: string; dueDate: string; status: string; responsibleUserId?: string | null }>;
    fields: Array<{ id: string; name?: string | null; area?: number | null; status?: string | null }>;
    tasks: Array<{ id: string; name: string; status: string; plannedDate?: string | null; slaExpiration?: string | null; assignee?: { id: string; fullName?: string | null } | null; responsible?: { id: string; fullName?: string | null } | null }>;
    documents: Array<{ id: string; date?: string | null; summary?: string | null; type?: string | null }>;
    risks: Array<{ id: string; description: string; dueDate: string; status: string }>;
    planFact: { plansTotal: number; activePlans: number; tasksTotal: number; tasksCompleted: number };
    agriMetrics: { totalArea: number; fieldsTotal: number; season: string; ndviState: string };
};

type EditForm = {
    name: string;
    inn: string;
    type: string;
    status: string;
    holdingId: string;
    jurisdiction: string;
    riskCategory: string;
    strategicValue: string;
};

export default function CounterpartyCardPage() {
    const params = useParams<{ counterpartyId: string }>();
    const counterpartyId = String(params?.counterpartyId || '').trim();
    const [companyId, setCompanyId] = useState('');
    const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState<EditForm>({
        name: '',
        inn: '',
        type: 'NOT_SET',
        status: 'ACTIVE',
        holdingId: '',
        jurisdiction: '',
        riskCategory: 'LOW',
        strategicValue: 'C',
    });
    const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', role: 'OPERATIONAL', email: '', phone: '', source: '' });
    const [interactionForm, setInteractionForm] = useState({ type: 'CORRESPONDENCE', summary: '', date: '', contactId: '' });
    const [obligationForm, setObligationForm] = useState({ description: '', dueDate: '', responsibleUserId: '', status: 'PENDING' });

    const load = async () => {
        setLoading(true);
        setErrorMessage(null);
        setForbidden(false);
        try {
            const meRes = await api.users.me();
            const nextCompanyId = String(meRes?.data?.companyId || '').trim();
            if (!nextCompanyId) {
                setErrorMessage('Не удалось определить компанию пользователя.');
                setWorkspace(null);
                return;
            }
            setCompanyId(nextCompanyId);
            const [workspaceRes, usersRes] = await Promise.all([
                api.crm.accountWorkspace(counterpartyId, nextCompanyId),
                api.users.company(nextCompanyId),
            ]);
            const payload = workspaceRes.data as WorkspacePayload;
            setWorkspace(payload || null);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
            if (payload?.account) {
                setEditForm({
                    name: String(payload.account.name || ''),
                    inn: String(payload.account.inn || ''),
                    type: String(payload.account.type || 'NOT_SET'),
                    status: String(payload.account.status || 'ACTIVE'),
                    holdingId: String(payload.account.holdingId || ''),
                    jurisdiction: String(payload.account.jurisdiction || ''),
                    riskCategory: String(payload.account.riskCategory || 'LOW'),
                    strategicValue: String(payload.account.strategicValue || 'C'),
                });
            }
        } catch (error) {
            console.error('Failed to load counterparty workspace:', error);
            if (axios.isAxiosError(error) && [401, 403].includes(Number(error.response?.status))) {
                setForbidden(true);
            } else {
                setErrorMessage('Не удалось загрузить карточку контрагента. Повторите запрос.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!counterpartyId) return;
        void load();
    }, [counterpartyId]);

    const saveProfile = async () => {
        if (!companyId || !workspace?.account?.id || saving) return;
        setSaving(true);
        setErrorMessage(null);
        try {
            await api.crm.updateAccount(workspace.account.id, {
                companyId,
                name: editForm.name.trim() || undefined,
                inn: editForm.inn.trim() || null,
                type: editForm.type,
                status: editForm.status,
                holdingId: editForm.holdingId.trim() || null,
                jurisdiction: editForm.jurisdiction.trim() || null,
                riskCategory: editForm.riskCategory,
                strategicValue: editForm.strategicValue,
            });
            await load();
        } catch (error) {
            console.error('Failed to update account profile:', error);
            setErrorMessage('Не удалось сохранить профиль контрагента. Проверьте значения и повторите.');
        } finally {
            setSaving(false);
        }
    };

    const createContact = async () => {
        if (!companyId || !workspace?.account?.id || !contactForm.firstName.trim()) return;
        await api.crm.createContact(workspace.account.id, {
            companyId,
            firstName: contactForm.firstName.trim(),
            lastName: contactForm.lastName.trim() || undefined,
            role: contactForm.role,
            email: contactForm.email.trim() || undefined,
            phone: contactForm.phone.trim() || undefined,
            source: contactForm.source.trim() || undefined,
        });
        setContactForm({ firstName: '', lastName: '', role: 'OPERATIONAL', email: '', phone: '', source: '' });
        await load();
    };

    const deleteContact = async (contactId: string) => {
        if (!companyId) return;
        await api.crm.deleteContact(contactId, companyId);
        await load();
    };

    const createInteraction = async () => {
        if (!companyId || !workspace?.account?.id || !interactionForm.summary.trim()) return;
        await api.crm.createInteraction(workspace.account.id, {
            companyId,
            type: interactionForm.type,
            summary: interactionForm.summary.trim(),
            date: interactionForm.date || undefined,
            contactId: interactionForm.contactId || undefined,
        });
        setInteractionForm({ type: 'CORRESPONDENCE', summary: '', date: '', contactId: '' });
        await load();
    };

    const deleteInteraction = async (interactionId: string) => {
        if (!companyId) return;
        await api.crm.deleteInteraction(interactionId, companyId);
        await load();
    };

    const createObligation = async () => {
        if (!companyId || !workspace?.account?.id || !obligationForm.description.trim() || !obligationForm.dueDate) return;
        await api.crm.createObligation(workspace.account.id, {
            companyId,
            description: obligationForm.description.trim(),
            dueDate: obligationForm.dueDate,
            responsibleUserId: obligationForm.responsibleUserId || undefined,
            status: obligationForm.status,
        });
        setObligationForm({ description: '', dueDate: '', responsibleUserId: '', status: 'PENDING' });
        await load();
    };

    const updateObligationStatus = async (obligationId: string, status: string) => {
        if (!companyId) return;
        await api.crm.updateObligation(obligationId, { companyId, status });
        await load();
    };

    const deleteObligation = async (obligationId: string) => {
        if (!companyId) return;
        await api.crm.deleteObligation(obligationId, companyId);
        await load();
    };

    const overdueCount = useMemo(() => {
        if (!workspace) return 0;
        const now = Date.now();
        return workspace.obligations.filter((item) => {
            if (!item.dueDate) return false;
            return new Date(item.dueDate).getTime() < now && item.status !== 'FULFILLED';
        }).length;
    }, [workspace]);

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between'>
                <h1 className='text-xl font-medium text-gray-900'>Карточка контрагента</h1>
                <Link href='/consulting/crm/counterparties' className='text-sm font-medium text-gray-700 hover:underline'>
                    Назад в реестр
                </Link>
            </div>

            {forbidden ? (
                <Card className='border-amber-200 bg-amber-50'><p className='text-sm text-amber-700'>Недостаточно прав для просмотра карточки контрагента.</p></Card>
            ) : errorMessage ? (
                <Card className='border-rose-200 bg-rose-50'>
                    <p className='text-sm text-rose-700 mb-3'>{errorMessage}</p>
                    <button onClick={() => void load()} className='text-sm font-medium text-rose-700 hover:underline'>Повторить запрос</button>
                </Card>
            ) : loading ? (
                <Card><p className='text-sm text-gray-500'>Загрузка...</p></Card>
            ) : !workspace ? (
                <Card className='border-amber-200 bg-amber-50'><p className='text-sm text-amber-700'>Контрагент не найден.</p></Card>
            ) : (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
                        <Card><p className='text-xs text-gray-500 mb-1'>Планов</p><p className='text-2xl font-semibold text-gray-900'>{workspace.planFact.plansTotal}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Активных</p><p className='text-2xl font-semibold text-gray-900'>{workspace.planFact.activePlans}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Поля</p><p className='text-2xl font-semibold text-gray-900'>{workspace.agriMetrics.fieldsTotal}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Площадь, га</p><p className='text-2xl font-semibold text-gray-900'>{workspace.agriMetrics.totalArea.toFixed(1)}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>SLA просрочено</p><p className='text-2xl font-semibold text-red-700'>{overdueCount}</p></Card>
                        <Card><p className='text-xs text-gray-500 mb-1'>Задач выполнено</p><p className='text-2xl font-semibold text-gray-900'>{workspace.planFact.tasksCompleted}/{workspace.planFact.tasksTotal}</p></Card>
                    </div>

                    <Tabs defaultValue='profile' className='space-y-4'>
                        <TabsList>
                            <TabsTrigger value='profile'>Профиль</TabsTrigger>
                            <TabsTrigger value='legal'>Юрлица</TabsTrigger>
                            <TabsTrigger value='fields'>Поля</TabsTrigger>
                            <TabsTrigger value='tasks'>Задачи</TabsTrigger>
                            <TabsTrigger value='documents'>Документы</TabsTrigger>
                            <TabsTrigger value='risks'>Риски</TabsTrigger>
                        </TabsList>

                        <TabsContent value='profile'>
                            <Card>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                                    <input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder='Наименование' className='h-9 rounded-md border border-gray-300 px-3' />
                                    <input value={editForm.inn} onChange={(e) => setEditForm((p) => ({ ...p, inn: e.target.value }))} placeholder='ИНН' className='h-9 rounded-md border border-gray-300 px-3' />
                                    <select value={editForm.type} onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3'>
                                        <option value='NOT_SET'>Не задано</option>
                                        <option value='CLIENT'>Клиент</option>
                                    </select>
                                    <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3'>
                                        <option value='ACTIVE'>ACTIVE</option><option value='RISK'>RISK</option><option value='FROZEN'>FROZEN</option>
                                    </select>
                                    <input value={editForm.holdingId} onChange={(e) => setEditForm((p) => ({ ...p, holdingId: e.target.value }))} placeholder='holdingId' className='h-9 rounded-md border border-gray-300 px-3' />
                                    <input value={editForm.jurisdiction} onChange={(e) => setEditForm((p) => ({ ...p, jurisdiction: e.target.value }))} placeholder='Юрисдикция' className='h-9 rounded-md border border-gray-300 px-3' />
                                    <select value={editForm.riskCategory} onChange={(e) => setEditForm((p) => ({ ...p, riskCategory: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3'>
                                        <option value='CRITICAL'>CRITICAL</option><option value='HIGH'>HIGH</option><option value='MEDIUM'>MEDIUM</option><option value='LOW'>LOW</option><option value='NONE'>NONE</option>
                                    </select>
                                    <select value={editForm.strategicValue} onChange={(e) => setEditForm((p) => ({ ...p, strategicValue: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3'>
                                        <option value='A'>A</option><option value='B'>B</option><option value='C'>C</option>
                                    </select>
                                </div>
                                <div className='mt-4 flex items-center justify-between'>
                                    <p className='text-xs text-gray-500'>API не даст `FROZEN`, если нет связанных хозяйств.</p>
                                    <button onClick={() => void saveProfile()} disabled={saving} className='h-9 rounded-md bg-gray-900 px-3 text-sm font-medium text-white disabled:opacity-60'>{saving ? 'Сохранение...' : 'Сохранить профиль'}</button>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value='legal'>
                            <Card>
                                {workspace.legalEntities.length > 0 ? workspace.legalEntities.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm'>
                                        <p className='font-medium text-gray-900'>{item.name || item.id}</p>
                                        <p className='text-gray-600'>{item.inn || '-'} · {item.type || '-'} · {item.status || '-'}</p>
                                    </div>
                                )) : <p className='text-sm text-gray-500'>Связанные юрлица не найдены.</p>}
                            </Card>
                        </TabsContent>

                        <TabsContent value='fields'>
                            <Card>
                                {workspace.fields.length > 0 ? workspace.fields.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm'>
                                        <p className='font-medium text-gray-900'>{item.name || item.id}</p>
                                        <p className='text-gray-600'>{Number(item.area || 0).toFixed(1)} га · {item.status || '-'}</p>
                                    </div>
                                )) : <p className='text-sm text-gray-500'>Хозяйства/поля не добавлены.</p>}
                            </Card>
                        </TabsContent>

                        <TabsContent value='tasks'>
                            <Card>
                                {workspace.tasks.length > 0 ? workspace.tasks.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm'>
                                        <p className='font-medium text-gray-900'>{item.name}</p>
                                        <p className='text-gray-600'>Статус: {item.status}</p>
                                        <p className='text-gray-600'>Ответственный: {item.responsible?.fullName || item.responsible?.id || '-'}</p>
                                        <p className='text-gray-600'>SLA: {item.slaExpiration ? new Date(item.slaExpiration).toLocaleDateString('ru-RU') : '-'}</p>
                                    </div>
                                )) : <p className='text-sm text-gray-500'>Задачи по контрагенту не найдены.</p>}
                            </Card>
                        </TabsContent>

                        <TabsContent value='documents'>
                            <Card>
                                <div className='grid grid-cols-1 md:grid-cols-4 gap-2 mb-4'>
                                    <select value={contactForm.role} onChange={(e) => setContactForm((p) => ({ ...p, role: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3 text-sm'>
                                        <option value='OPERATIONAL'>OPERATIONAL</option><option value='LEGAL'>LEGAL</option><option value='DECISION_MAKER'>DECISION_MAKER</option>
                                    </select>
                                    <input value={contactForm.firstName} onChange={(e) => setContactForm((p) => ({ ...p, firstName: e.target.value }))} placeholder='Имя контакта' className='h-9 rounded-md border border-gray-300 px-3 text-sm' />
                                    <input value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} placeholder='Email' className='h-9 rounded-md border border-gray-300 px-3 text-sm' />
                                    <button onClick={() => void createContact()} className='h-9 rounded-md bg-gray-900 px-3 text-sm font-medium text-white'>Добавить контакт</button>
                                </div>
                                {workspace.contacts.length > 0 ? workspace.contacts.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm flex items-center justify-between'>
                                        <div>
                                            <p className='font-medium text-gray-900'>{item.firstName} {item.lastName || ''}</p>
                                            <p className='text-gray-600'>{item.role || '-'} · {item.email || '-'} · {item.phone || '-'}</p>
                                        </div>
                                        <button onClick={() => void deleteContact(item.id)} className='text-xs text-rose-700 hover:underline'>Удалить</button>
                                    </div>
                                )) : <p className='text-sm text-gray-500'>Контакты не добавлены.</p>}

                                <div className='mt-4 grid grid-cols-1 md:grid-cols-5 gap-2'>
                                    <select value={interactionForm.type} onChange={(e) => setInteractionForm((p) => ({ ...p, type: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3 text-sm'>
                                        <option value='CORRESPONDENCE'>CORRESPONDENCE</option><option value='MEETING'>MEETING</option><option value='CALL'>CALL</option><option value='DOC_SUBMISSION'>DOC_SUBMISSION</option><option value='REQUEST_RESPONSE'>REQUEST_RESPONSE</option>
                                    </select>
                                    <input value={interactionForm.summary} onChange={(e) => setInteractionForm((p) => ({ ...p, summary: e.target.value }))} placeholder='Суть взаимодействия' className='h-9 rounded-md border border-gray-300 px-3 text-sm md:col-span-2' />
                                    <input type='date' value={interactionForm.date} onChange={(e) => setInteractionForm((p) => ({ ...p, date: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3 text-sm' />
                                    <button onClick={() => void createInteraction()} className='h-9 rounded-md bg-gray-900 px-3 text-sm font-medium text-white'>Добавить событие</button>
                                </div>
                                {workspace.interactions.length > 0 ? workspace.interactions.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm flex items-center justify-between mt-2'>
                                        <div>
                                            <p className='font-medium text-gray-900'>{item.summary || item.type || '-'}</p>
                                            <p className='text-gray-600'>{item.type || '-'} · {item.date ? new Date(item.date).toLocaleDateString('ru-RU') : '-'}</p>
                                        </div>
                                        <button onClick={() => void deleteInteraction(item.id)} className='text-xs text-rose-700 hover:underline'>Удалить</button>
                                    </div>
                                )) : <p className='text-sm text-gray-500 mt-2'>Взаимодействия не добавлены.</p>}
                            </Card>
                        </TabsContent>

                        <TabsContent value='risks'>
                            <Card>
                                <div className='mb-3 text-xs text-gray-500'>Агро-метрики: сезон {workspace.agriMetrics.season}, NDVI {workspace.agriMetrics.ndviState}, площадь {workspace.agriMetrics.totalArea.toFixed(1)} га.</div>
                                <div className='grid grid-cols-1 md:grid-cols-5 gap-2 mb-4'>
                                    <input value={obligationForm.description} onChange={(e) => setObligationForm((p) => ({ ...p, description: e.target.value }))} placeholder='Описание риска/обязательства' className='h-9 rounded-md border border-gray-300 px-3 text-sm md:col-span-2' />
                                    <input type='date' value={obligationForm.dueDate} onChange={(e) => setObligationForm((p) => ({ ...p, dueDate: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3 text-sm' />
                                    <select value={obligationForm.responsibleUserId} onChange={(e) => setObligationForm((p) => ({ ...p, responsibleUserId: e.target.value }))} className='h-9 rounded-md border border-gray-300 px-3 text-sm'>
                                        <option value=''>Ответственный: не выбран</option>
                                        {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>)}
                                    </select>
                                    <button onClick={() => void createObligation()} className='h-9 rounded-md bg-gray-900 px-3 text-sm font-medium text-white'>Добавить</button>
                                </div>

                                {workspace.obligations.length > 0 ? workspace.obligations.map((item) => (
                                    <div key={item.id} className='border-b last:border-b-0 pb-2 mb-2 text-sm'>
                                        <p className='font-medium text-gray-900'>{item.description}</p>
                                        <p className='text-gray-600'>Срок: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ru-RU') : '-'} · Ответственный: {users.find((u) => u.id === item.responsibleUserId)?.name || item.responsibleUserId || '-'}</p>
                                        <div className='mt-1 flex items-center gap-3'>
                                            <select value={item.status} onChange={(e) => void updateObligationStatus(item.id, e.target.value)} className='h-8 rounded-md border border-gray-300 px-2 text-xs'>
                                                <option value='PENDING'>PENDING</option><option value='FULFILLED'>FULFILLED</option><option value='BREACHED'>BREACHED</option>
                                            </select>
                                            <button onClick={() => void deleteObligation(item.id)} className='text-xs text-rose-700 hover:underline'>Удалить</button>
                                        </div>
                                    </div>
                                )) : <p className='text-sm text-gray-500'>Активные риски/обязательства не найдены.</p>}
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
