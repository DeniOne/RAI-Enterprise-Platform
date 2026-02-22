'use client';

import React, { useState } from 'react';
import { X, Save, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

interface CompletionModalProps {
    operation: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    isSubmitting: boolean;
}

/**
 * CompletionModal
 * @description Модальное окно завершения операции, переработанное согласно UI Design Canon.
 * Канон: Light Theme (#FAFAFA), Geist Medium (500), rounded-2xl.
 */
export const CompletionModal: React.FC<CompletionModalProps> = ({
    operation,
    isOpen,
    onClose,
    onConfirm,
    isSubmitting
}) => {
    const [notes, setNotes] = useState('');
    const [actualResources, setActualResources] = useState<any[]>(
        operation?.resources?.map((r: any) => ({
            resourceId: r.id,
            name: r.name,
            amount: r.plannedAmount,
            unit: r.unit
        })) || []
    );

    if (!isOpen || !operation) return null;

    const handleAmountChange = (index: number, value: string) => {
        const updated = [...actualResources];
        updated[index].amount = parseFloat(value) || 0;
        setActualResources(updated);
    };

    const handleConfirm = () => {
        onConfirm({
            operationId: operation.id,
            notes,
            actualResources: actualResources.map(r => ({
                resourceId: r.resourceId,
                amount: r.amount
            }))
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#FAFAFA] border border-black/10 rounded-2xl shadow-2xl overflow-hidden scale-in-center">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-black/5 bg-white">
                    <div>
                        <h2 className="text-lg font-medium text-slate-900">Завершение операции</h2>
                        <p className="text-xs text-slate-500 mt-0.5 font-normal">{operation.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Фактический расход ресурсов
                        </label>
                        <div className="space-y-2">
                            {actualResources.map((res, idx) => (
                                <div key={res.resourceId} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-black/5">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100/50">
                                        <Box className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{res.name}</p>
                                        <p className="text-[10px] text-slate-400 font-normal">План: {operation.resources[idx]?.plannedAmount} {res.unit}</p>
                                    </div>
                                    <div className="w-24 flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="text-right h-8 text-xs bg-slate-50 border-black/5 focus-visible:ring-blue-500/20 font-medium"
                                            value={res.amount}
                                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                                        />
                                        <span className="text-[10px] text-slate-400 font-medium uppercase">{res.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Заметки и отчет
                        </label>
                        <textarea
                            className="w-full h-24 p-4 bg-white border border-black/5 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 font-normal resize-none"
                            placeholder="Опишите результат или отклонения..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-black/5 flex gap-3">
                    <Button variant="ghost" className="flex-1 text-slate-500 font-medium text-xs hover:bg-slate-50" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        className="flex-1 bg-slate-900 hover:bg-black text-white gap-2 h-10 text-xs font-medium rounded-xl shadow-none"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        <Save className="w-4 h-4" /> Зафиксировать факт
                    </Button>
                </div>
            </div>
        </div>
    );
};
