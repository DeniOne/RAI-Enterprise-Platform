'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';

type SignalSource = 'MARKET' | 'CLIENT' | 'AI' | 'INTERNAL';

const SOURCE_OPTIONS: Array<{ value: SignalSource; label: string }> = [
    { value: 'INTERNAL', label: 'Внутренний' },
    { value: 'CLIENT', label: 'Клиентский' },
    { value: 'MARKET', label: 'Рыночный' },
    { value: 'AI', label: 'AI' },
];

export function TriageInputForm({ onCreated }: { onCreated?: () => void }) {
    const [source, setSource] = useState<SignalSource>('INTERNAL');
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [confidenceScore, setConfidenceScore] = useState<number>(70);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const canSubmit = useMemo(() => title.trim().length > 2 && !submitting, [title, submitting]);

    const onSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await api.exploration.createSignal({
                source,
                confidenceScore,
                rawPayload: {
                    title: title.trim(),
                    details: details.trim(),
                },
            });
            setTitle('');
            setDetails('');
            setSuccess('Сигнал отправлен');
            onCreated?.();
        } catch {
            setError('Не удалось отправить сигнал');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-black/10 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900">Создать сигнал</h3>
            <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-gray-700">
                    Источник
                    <select
                        className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                        value={source}
                        onChange={(event) => setSource(event.target.value as SignalSource)}
                    >
                        {SOURCE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-xs font-medium text-gray-700">
                    Достоверность (0-100)
                    <Input
                        type="number"
                        min={0}
                        max={100}
                        value={confidenceScore}
                        onChange={(event) => setConfidenceScore(Number(event.target.value))}
                    />
                </label>
            </div>
            <label className="block text-xs font-medium text-gray-700">
                Заголовок
                <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Краткая формулировка проблемы"
                />
            </label>
            <label className="block text-xs font-medium text-gray-700">
                Детали
                <textarea
                    className="mt-1 min-h-24 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    value={details}
                    onChange={(event) => setDetails(event.target.value)}
                    placeholder="Контекст, влияние, ограничения"
                />
            </label>
            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            {success ? <p className="text-xs text-green-700">{success}</p> : null}
            <div className="flex justify-end">
                <Button type="submit" disabled={!canSubmit}>
                    {submitting ? 'Отправка...' : 'Отправить сигнал'}
                </Button>
            </div>
        </form>
    );
}
