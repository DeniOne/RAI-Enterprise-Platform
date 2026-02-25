'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { api } from '@/lib/api';

const TARGET_STATUS_OPTIONS = [
    'IN_TRIAGE',
    'BOARD_REVIEW',
    'ACTIVE_EXPLORATION',
    'WAR_ROOM',
    'IMPLEMENTED',
    'POST_AUDIT',
    'REJECTED',
    'ARCHIVED',
] as const;

export default function ExplorationCasePage() {
    const params = useParams<{ id: string }>();
    const caseId = useMemo(() => String(params?.id ?? ''), [params]);

    const [targetStatus, setTargetStatus] = useState<string>('IN_TRIAGE');
    const [role, setRole] = useState('TRIAGE_OFFICER');
    const [facilitatorId, setFacilitatorId] = useState('');
    const [participantUserId, setParticipantUserId] = useState('');
    const [participantRole, setParticipantRole] = useState('DECISION_MAKER');
    const [deadline, setDeadline] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onTransition = async (event: FormEvent) => {
        event.preventDefault();
        if (!caseId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        try {
            await api.exploration.transitionCase(caseId, { targetStatus, role });
            setMessage(`Кейс переведен в статус ${targetStatus}`);
        } catch {
            setError('Не удалось выполнить переход кейса');
        } finally {
            setBusy(false);
        }
    };

    const onOpenWarRoom = async (event: FormEvent) => {
        event.preventDefault();
        if (!caseId || !facilitatorId || !participantUserId || !deadline) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        try {
            const response = await api.exploration.openWarRoom(caseId, {
                facilitatorId,
                deadline,
                participants: [{ userId: participantUserId, role: participantRole }],
            });
            const sessionId = String(response?.data?.id ?? '');
            setMessage(sessionId ? `Комната решений открыта: ${sessionId}` : 'Комната решений открыта');
        } catch {
            setError('Не удалось открыть комнату решений');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-gray-900">Кейс исследования</h1>
                <p className="text-sm text-gray-600">ID кейса: {caseId || 'н/д'}</p>
                <Link href="/exploration" className="text-sm text-blue-700 hover:underline">
                    Назад к витрине
                </Link>
            </div>

            <Card className="space-y-3 rounded-2xl border-black/10">
                <h2 className="text-sm font-semibold text-gray-900">Переход FSM</h2>
                <form className="grid gap-3 md:grid-cols-3" onSubmit={onTransition}>
                    <label className="text-xs font-medium text-gray-700">
                        Целевой статус
                        <select
                            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                            value={targetStatus}
                            onChange={(event) => setTargetStatus(event.target.value)}
                        >
                            {TARGET_STATUS_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-medium text-gray-700">
                        Роль
                        <Input value={role} onChange={(event) => setRole(event.target.value)} />
                    </label>
                    <div className="flex items-end">
                        <Button type="submit" disabled={busy || !caseId}>
                            {busy ? 'Отправка...' : 'Применить переход'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="space-y-3 rounded-2xl border-black/10">
                <h2 className="text-sm font-semibold text-gray-900">Открыть комнату решений</h2>
                <form className="grid gap-3 md:grid-cols-2" onSubmit={onOpenWarRoom}>
                    <label className="text-xs font-medium text-gray-700">
                        ID фасилитатора
                        <Input value={facilitatorId} onChange={(event) => setFacilitatorId(event.target.value)} />
                    </label>
                    <label className="text-xs font-medium text-gray-700">
                        Дедлайн (ISO date-time)
                        <Input
                            type="datetime-local"
                            value={deadline}
                            onChange={(event) => setDeadline(event.target.value)}
                        />
                    </label>
                    <label className="text-xs font-medium text-gray-700">
                        ID участника
                        <Input value={participantUserId} onChange={(event) => setParticipantUserId(event.target.value)} />
                    </label>
                    <label className="text-xs font-medium text-gray-700">
                        Роль участника
                        <Input value={participantRole} onChange={(event) => setParticipantRole(event.target.value)} />
                    </label>
                    <div className="md:col-span-2">
                        <Button type="submit" disabled={busy || !caseId}>
                            {busy ? 'Отправка...' : 'Открыть комнату решений'}
                        </Button>
                    </div>
                </form>
            </Card>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </div>
    );
}
