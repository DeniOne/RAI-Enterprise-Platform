'use client';

import React, { useState } from 'react';
import { X, Save, Box } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';

interface CompletionModalProps {
    operation: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    isSubmitting: boolean;
}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden scale-in-center">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">Завершение операции</h2>
                        <p className="text-sm text-slate-400 mt-1">{operation.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Фактический расход ресурсов</label>
                        <div className="space-y-3">
                            {actualResources.map((res, idx) => (
                                <div key={res.resourceId} className="flex items-center gap-4 p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Box className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{res.name}</p>
                                        <p className="text-xs text-slate-500">План: {operation.resources[idx].plannedAmount} {res.unit}</p>
                                    </div>
                                    <div className="w-24 flex items-center gap-2">
                                        <Input
                                            type="number"
                                            className="text-right h-8 text-sm bg-slate-800/50"
                                            value={res.amount}
                                            onChange={(e) => handleAmountChange(idx, e.target.value)}
                                        />
                                        <span className="text-xs text-slate-400">{res.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Заметки и отчет об исполнении</label>
                        <textarea
                            className="w-full h-24 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Введите примечания, возникшие сложности или подтверждение факта..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex gap-3">
                    <Button variant="ghost" className="flex-1 text-slate-400" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                        onClick={handleConfirm}
                        loading={isSubmitting}
                    >
                        <Save className="w-4 h-4" /> Сохранить факт
                    </Button>
                </div>
            </div>
        </div>
    );
};
