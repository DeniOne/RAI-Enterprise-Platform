'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { api } from '@/lib/api';

export default function ExplorationWarRoomPage() {
    const params = useParams<{ sessionId: string }>();
    const sessionId = useMemo(() => String(params?.sessionId ?? ''), [params]);

    const [participantId, setParticipantId] = useState('');
    const [signatureHash, setSignatureHash] = useState('');
    const [decisionText, setDecisionText] = useState('');
    const [resolutionLog, setResolutionLog] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onAppendEvent = async (event: FormEvent) => {
        event.preventDefault();
        if (!sessionId || !participantId || !signatureHash) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        try {
            await api.exploration.appendWarRoomEvent(sessionId, {
                participantId,
                signatureHash,
                decisionData: {
                    note: decisionText.trim(),
                    createdAt: new Date().toISOString(),
                },
            });
            setMessage('Событие решения добавлено');
            setDecisionText('');
        } catch {
            setError('Не удалось добавить событие решения');
        } finally {
            setBusy(false);
        }
    };

    const onCloseSession = async (event: FormEvent) => {
        event.preventDefault();
        if (!sessionId || !resolutionLog.trim()) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        try {
            await api.exploration.closeWarRoom(sessionId, {
                resolutionLog: {
                    summary: resolutionLog.trim(),
                    closedAt: new Date().toISOString(),
                },
            });
            setMessage('Комната решений закрыта');
        } catch {
            setError('Не удалось закрыть комнату решений');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h1 className="text-xl font-semibold text-gray-900">Сессия комнаты решений</h1>
                <p className="text-sm text-gray-600">ID сессии: {sessionId || 'н/д'}</p>
                <Link href="/exploration" className="text-sm text-blue-700 hover:underline">
                    Назад к витрине
                </Link>
            </div>

            <Card className="space-y-3 rounded-2xl border-black/10">
                <h2 className="text-sm font-semibold text-gray-900">Добавить событие решения</h2>
                <form className="grid gap-3 md:grid-cols-2" onSubmit={onAppendEvent}>
                    <label className="text-xs font-medium text-gray-700">
                        ID участника
                        <Input value={participantId} onChange={(event) => setParticipantId(event.target.value)} />
                    </label>
                    <label className="text-xs font-medium text-gray-700">
                        Хеш подписи
                        <Input value={signatureHash} onChange={(event) => setSignatureHash(event.target.value)} />
                    </label>
                    <label className="text-xs font-medium text-gray-700 md:col-span-2">
                        Примечание к решению
                        <textarea
                            className="mt-1 min-h-24 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                            value={decisionText}
                            onChange={(event) => setDecisionText(event.target.value)}
                            placeholder="Комментарий к payload решения"
                        />
                    </label>
                    <div className="md:col-span-2">
                        <Button type="submit" disabled={busy || !sessionId}>
                            {busy ? 'Отправка...' : 'Добавить событие'}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="space-y-3 rounded-2xl border-black/10">
                <h2 className="text-sm font-semibold text-gray-900">Закрыть сессию</h2>
                <form className="space-y-3" onSubmit={onCloseSession}>
                    <label className="block text-xs font-medium text-gray-700">
                        Лог резолюции
                        <textarea
                            className="mt-1 min-h-24 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                            value={resolutionLog}
                            onChange={(event) => setResolutionLog(event.target.value)}
                            placeholder="Что было решено и почему"
                        />
                    </label>
                    <Button type="submit" disabled={busy || !sessionId || !resolutionLog.trim()}>
                        {busy ? 'Отправка...' : 'Закрыть комнату решений'}
                    </Button>
                </form>
            </Card>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </div>
    );
}
