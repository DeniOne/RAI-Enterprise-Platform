'use client';

import React, { useRef, useState } from 'react';
import clsx from 'clsx';
import type { Operation } from './TechMapWorkbench';
import { formatEvidenceTypeLabel } from '@/lib/ui-language';

interface EvidencePanelProps {
    operations: Operation[];
    isFrozen: boolean;
}

export function EvidencePanel({ operations, isFrozen }: EvidencePanelProps) {
    const [uploadingFor, setUploadingFor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);

    const relevantOperations = operations.filter(
        (op) => op.evidenceRequired || (op.evidences && op.evidences.length > 0),
    );

    const handleUploadClick = (operationId: string) => {
        if (isFrozen) {
            return;
        }
        setCurrentOperationId(operationId);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !currentOperationId || isFrozen) {
            return;
        }

        setUploadingFor(currentOperationId);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('operationId', currentOperationId);
            formData.append('evidenceType', 'PHOTO');

            const response = await fetch('/api/tech-map/evidence', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Не удалось загрузить подтверждение');
            }
        } catch {
            setError('Не удалось загрузить доказательство. Повторите попытку позже.');
        } finally {
            setUploadingFor(null);
            setCurrentOperationId(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (relevantOperations.length === 0) {
        return (
            <div className="p-4 bg-white rounded-2xl border border-black/5 text-xs text-gray-400">
                Для операций этой техкарты нет требований по доказательствам.
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-2xl border border-black/5 space-y-3">
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isFrozen}
            />

            {error && (
                <div className="text-[11px] text-red-600">
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {relevantOperations.map((op) => (
                    <div
                        key={op.id}
                        className="flex flex-col gap-2 p-3 rounded-2xl border border-black/5 bg-gray-50/50"
                    >
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{op.title}</span>
                                {op.evidenceRequired && (
                                    <span className="inline-flex items-center text-[10px] text-amber-600">
                                        <span className="mr-1">📎</span>
                                        требуется доказательство
                                    </span>
                                )}
                            </div>

                            {!isFrozen && op.evidenceRequired && (
                                <button
                                    type="button"
                                    onClick={() => handleUploadClick(op.id)}
                                    disabled={uploadingFor === op.id}
                                    className={clsx(
                                        "px-3 py-1.5 rounded-xl text-[11px] border",
                                        "bg-white border-black/10 text-gray-800 hover:bg-gray-50",
                                        uploadingFor === op.id && "opacity-70 cursor-wait",
                                    )}
                                >
                                    {uploadingFor === op.id ? 'Загрузка…' : 'Прикрепить доказательство'}
                                </button>
                            )}
                        </div>

                        {op.evidences && op.evidences.length > 0 && (
                            <div className="pl-1 space-y-1">
                                {op.evidences.map((ev) => (
                                    <div key={ev.id} className="flex items-center gap-2 text-[11px] text-gray-600">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                            {formatEvidenceTypeLabel(ev.evidenceType)}
                                            </span>
                                        <span>
                                            {new Date(ev.capturedAt).toLocaleDateString()}
                                        </span>
                                        {ev.fileUrl && (
                                            <a
                                                href={ev.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-600 underline-offset-2 hover:underline"
                                            >
                                                открыть
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
