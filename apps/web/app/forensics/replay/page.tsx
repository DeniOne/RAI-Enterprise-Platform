'use client';

import React, { useMemo, useState } from 'react';
import { useSessionIntegrity } from '@/shared/hooks/useSessionIntegrity';
import { formatStatusLabel } from '@/lib/ui-language';

const safeParseJson = (raw: string): Record<string, unknown> | null => {
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
};

export default function ReplayPage() {
    const { traceId, integrityStatus, mismatch, verifyReplay } = useSessionIntegrity();
    const [recordedHash, setRecordedHash] = useState(mismatch?.expectedHash ?? '');
    const [payloadRaw, setPayloadRaw] = useState('{\n  "traceId": "' + traceId + '"\n}');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const parsedPayload = useMemo(() => safeParseJson(payloadRaw), [payloadRaw]);

    const onVerify = async () => {
        setLocalError(null);
        if (!recordedHash.trim()) {
            setLocalError('Укажите записанный хэш.');
            return;
        }
        if (!parsedPayload) {
            setLocalError('Поле данных должно содержать корректный JSON-объект.');
            return;
        }

        setBusy(true);
        try {
            await verifyReplay(recordedHash.trim(), parsedPayload);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-8">
            <div>
                <h1 className="text-xl font-medium text-gray-900">Проверка воспроизведения трассы</h1>
                <p className="mt-1 text-sm font-normal text-gray-500">
                    Детерминированная проверка воспроизведения по записанному хэшу журнала.
                </p>
            </div>

            <div className="rounded-xl border border-gray-300 bg-white p-4 font-mono text-xs text-gray-800">
                <div>Идентификатор трассы: {traceId}</div>
                <div>Статус целостности: {formatStatusLabel(integrityStatus)}</div>
                <div>Ожидаемый хэш: {mismatch?.expectedHash ?? '—'}</div>
                <div>Фактический хэш: {mismatch?.actualHash ?? '—'}</div>
            </div>

            <div className="space-y-4 rounded-xl border border-gray-300 bg-white p-4">
                <label className="block text-xs font-medium text-gray-700">
                    Записанный хэш
                    <input
                        value={recordedHash}
                        onChange={(e) => setRecordedHash(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                        placeholder="Хэш контроля целостности SHA-256, 64 символа"
                    />
                </label>

                <label className="block text-xs font-medium text-gray-700">
                    Данные для воспроизведения (JSON-объект)
                    <textarea
                        value={payloadRaw}
                        onChange={(e) => setPayloadRaw(e.target.value)}
                        rows={12}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                    />
                </label>

                {localError && <p className="text-xs text-red-700">{localError}</p>}

                <button
                    onClick={onVerify}
                    disabled={busy}
                    className="rounded border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                    {busy ? 'Проверяем...' : 'Проверить воспроизведение'}
                </button>
            </div>
        </div>
    );
}
