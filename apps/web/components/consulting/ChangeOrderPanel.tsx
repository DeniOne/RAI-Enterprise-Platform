'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import type { ChangeOrderSummary } from './TechMapWorkbench';

type ChangeOrderType = 'SHIFT_DATE' | 'CHANGE_INPUT' | 'CHANGE_RATE' | 'CANCEL_OP' | 'ADD_OP';

interface ChangeOrderPanelProps {
    techMapId: string;
    changeOrders?: ChangeOrderSummary[];
    isFrozen: boolean;
}

export function ChangeOrderPanel({ techMapId, changeOrders, isFrozen }: ChangeOrderPanelProps) {
    const [reason, setReason] = useState('');
    const [changeType, setChangeType] = useState<ChangeOrderType>('SHIFT_DATE');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasOrders = changeOrders && changeOrders.length > 0;

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        if (isFrozen || submitting) {
            return;
        }

        if (!reason.trim()) {
            setError('Опишите причину изменения.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/tech-map/change-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    techMapId,
                    changeType,
                    reason,
                    diffPayload: {},
                }),
            });

            if (!response.ok) {
                throw new Error('Change order failed');
            }

            setReason('');
            setChangeType('SHIFT_DATE');
        } catch {
            setError('Не удалось создать запрос на изменение. Повторите попытку позже.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-2xl border border-black/5 space-y-4">
            {hasOrders && (
                <div className="space-y-2">
                    <div className="text-xs text-gray-500">Текущие запросы на изменение</div>
                    <div className="space-y-1">
                        {changeOrders!.map((co) => (
                            <div
                                key={co.id}
                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-black/5"
                            >
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-800 line-clamp-2">{co.reason}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(co.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <span
                                    className={clsx(
                                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                        co.status === 'DRAFT' && "bg-gray-100 text-gray-600",
                                        co.status === 'PENDING_APPROVAL' && "bg-amber-100 text-amber-700",
                                        co.status === 'APPROVED' && "bg-emerald-100 text-emerald-700",
                                        co.status === 'REJECTED' && "bg-red-100 text-red-700",
                                    )}
                                >
                                    {co.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isFrozen && (
                <div className="text-[11px] text-gray-500">
                    Техкарта в режиме FROZEN. Создание новых запросов на изменение недоступно.
                </div>
            )}

            {!isFrozen && (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">
                            Тип изменения
                        </label>
                        <select
                            value={changeType}
                            onChange={(e) => setChangeType(e.target.value as ChangeOrderType)}
                            className="border border-black/10 rounded-xl px-3 py-1.5 text-xs bg-white text-gray-800"
                        >
                            <option value="SHIFT_DATE">Сдвиг даты операции</option>
                            <option value="CHANGE_INPUT">Изменение препарата</option>
                            <option value="CHANGE_RATE">Изменение нормы внесения</option>
                            <option value="CANCEL_OP">Отмена операции</option>
                            <option value="ADD_OP">Добавление операции</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-600">
                            Причина изменения
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="border border-black/10 rounded-xl px-3 py-2 text-xs bg-white text-gray-800 resize-none"
                            placeholder="Опишите, что нужно изменить и почему."
                        />
                    </div>

                    {error && (
                        <div className="text-[11px] text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className={clsx(
                            "w-full px-4 py-2 rounded-xl text-xs font-medium",
                            "bg-black text-white hover:bg-gray-800 active:scale-95",
                            submitting && "opacity-70 cursor-wait",
                        )}
                    >
                        {submitting ? 'Отправка…' : 'Создать запрос на изменение'}
                    </button>
                </form>
            )}
        </div>
    );
}

