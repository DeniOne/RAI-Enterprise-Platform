'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Link2, Loader2, ShieldAlert } from 'lucide-react';
import * as QRCode from 'qrcode';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { formatEvidenceTypeLabel } from '@/lib/ui-language';

interface OperationEvidencePanelProps {
    operation: any;
    preferredEvidenceType?: string | null;
    panelId?: string;
}

type SourceLaunchStatus =
    | { tone: 'info' | 'success' | 'warning'; message: string }
    | null;

type CopyRouteStatus =
    | { tone: 'success' | 'warning'; message: string }
    | null;

interface ArtifactHistoryEntry {
    url: string;
    savedAt: string;
}

interface RemovedArtifactUndoState {
    evidenceType: string;
    entry: ArtifactHistoryEntry;
    expiresAt: number;
}

const EVIDENCE_TYPES = [
    'PHOTO',
    'VIDEO',
    'GEO_TRACK',
    'LAB_REPORT',
    'INVOICE',
    'CONTRACT',
    'WEATHER_API_SNAPSHOT',
    'SATELLITE_IMAGE',
];

const EVIDENCE_PLACEHOLDERS: Record<string, string> = {
    PHOTO: 'https://.../field-photo.jpg',
    VIDEO: 'https://.../field-video.mp4',
    GEO_TRACK: 'https://.../geo-track.json',
    LAB_REPORT: 'https://.../lab-report.pdf',
    INVOICE: 'https://.../invoice.pdf',
    CONTRACT: 'https://.../contract.pdf',
    WEATHER_API_SNAPSHOT: 'https://.../weather-snapshot.json',
    SATELLITE_IMAGE: 'https://.../satellite-image.tif',
};

const EVIDENCE_TEMPLATE_SOURCES: Record<string, string> = {
    PHOTO: 'camera://capture/latest-photo',
    VIDEO: 'camera://capture/latest-video',
    GEO_TRACK: 'geo://track/current-route',
    LAB_REPORT: 'lab://report/latest-pdf',
    INVOICE: 'files://finance/latest-invoice',
    CONTRACT: 'files://legal/current-contract',
    WEATHER_API_SNAPSHOT: 'weather-api://snapshot/current-window',
    SATELLITE_IMAGE: 'satellite://imagery/latest-scene',
};

const EVIDENCE_SOURCE_ACTIONS: Record<string, { label: string; description: string }> = {
    PHOTO: {
        label: 'Открыть камеру',
        description: 'Запустить capture-flow для полевого фото.',
    },
    VIDEO: {
        label: 'Открыть видео',
        description: 'Запустить capture-flow для видеозаписи.',
    },
    GEO_TRACK: {
        label: 'Открыть геомаршрут',
        description: 'Запустить маршрут трека для текущей операции.',
    },
    LAB_REPORT: {
        label: 'Открыть лабораторный отчёт',
        description: 'Перейти к последнему лабораторному отчёту.',
    },
    INVOICE: {
        label: 'Открыть счёт',
        description: 'Перейти к последнему финансовому документу.',
    },
    CONTRACT: {
        label: 'Открыть договор',
        description: 'Перейти к текущему контрактному документу.',
    },
    WEATHER_API_SNAPSHOT: {
        label: 'Сделать погодный снимок',
        description: 'Открыть источник погодного снимка для текущего окна.',
    },
    SATELLITE_IMAGE: {
        label: 'Открыть спутниковый источник',
        description: 'Перейти к последней спутниковой сцене.',
    },
};

const LAST_SOURCE_STORAGE_KEY = 'consulting:execution:last-evidence-source-by-type';
const ARTIFACT_HISTORY_STORAGE_KEY = 'consulting:execution:artifact-history-by-type';
const UNDO_WINDOW_MS = 6000;
const INTERMEDIATE_ROUTE_SCHEMES = [
    'camera://',
    'weather-api://',
    'satellite://',
    'geo://',
    'lab://',
    'files://',
];

function readLastEvidenceSources(): Record<string, string> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(LAST_SOURCE_STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeLastEvidenceSource(evidenceType: string, source: string) {
    if (typeof window === 'undefined' || !source.trim()) {
        return;
    }

    const current = readLastEvidenceSources();
    current[evidenceType] = source.trim();
    window.localStorage.setItem(LAST_SOURCE_STORAGE_KEY, JSON.stringify(current));
}

function readArtifactHistory(): Record<string, ArtifactHistoryEntry[]> {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.localStorage.getItem(ARTIFACT_HISTORY_STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writeArtifactHistoryEntry(evidenceType: string, url: string) {
    if (typeof window === 'undefined' || !url.trim()) {
        return;
    }

    upsertArtifactHistoryEntry(evidenceType, {
        url: url.trim(),
        savedAt: new Date().toISOString(),
    });
}

function upsertArtifactHistoryEntry(evidenceType: string, nextEntry: ArtifactHistoryEntry) {
    if (typeof window === 'undefined' || !nextEntry.url.trim()) {
        return;
    }

    const current = readArtifactHistory();
    const existingEntries = Array.isArray(current[evidenceType]) ? current[evidenceType] : [];
    const deduplicated = existingEntries.filter((entry) => entry?.url !== nextEntry.url);
    current[evidenceType] = [nextEntry, ...deduplicated].slice(0, 3);
    window.localStorage.setItem(ARTIFACT_HISTORY_STORAGE_KEY, JSON.stringify(current));
}

function clearArtifactHistoryForType(evidenceType: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const current = readArtifactHistory();
    delete current[evidenceType];
    window.localStorage.setItem(ARTIFACT_HISTORY_STORAGE_KEY, JSON.stringify(current));
}

function removeArtifactHistoryEntry(evidenceType: string, url: string) {
    if (typeof window === 'undefined') {
        return;
    }

    const current = readArtifactHistory();
    const existingEntries = Array.isArray(current[evidenceType]) ? current[evidenceType] : [];
    current[evidenceType] = existingEntries.filter((entry) => entry?.url !== url);

    if (current[evidenceType].length === 0) {
        delete current[evidenceType];
    }

    window.localStorage.setItem(ARTIFACT_HISTORY_STORAGE_KEY, JSON.stringify(current));
}

async function sha256Hex(input: string) {
    const buffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(input),
    );
    return Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function OperationEvidencePanel({
    operation,
    preferredEvidenceType,
    panelId,
}: OperationEvidencePanelProps) {
    const queryClient = useQueryClient();
    const operationId = operation?.id;
    const [fileUrl, setFileUrl] = useState('');
    const [evidenceType, setEvidenceType] = useState('PHOTO');
    const [metaNote, setMetaNote] = useState('');
    const [sourceHint, setSourceHint] = useState<string | null>(null);
    const [sourceLaunchStatus, setSourceLaunchStatus] = useState<SourceLaunchStatus>(null);
    const [copyRouteStatus, setCopyRouteStatus] = useState<CopyRouteStatus>(null);
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [captureCompleted, setCaptureCompleted] = useState(false);
    const [artifactHistoryRevision, setArtifactHistoryRevision] = useState(0);
    const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
    const [removedArtifactUndo, setRemovedArtifactUndo] = useState<RemovedArtifactUndoState | null>(null);
    const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);
    const fileUrlInputRef = useRef<HTMLInputElement | null>(null);
    const undoTimeoutRef = useRef<number | null>(null);

    const { data: evidence, isLoading: isEvidenceLoading } = useQuery({
        queryKey: ['consulting', 'execution-evidence', operationId],
        queryFn: () => api.consulting.execution.evidence(operationId).then((res) => res.data),
        enabled: Boolean(operationId),
        initialData: operation?.evidence || [],
    });

    const { data: evidenceStatus, isLoading: isStatusLoading } = useQuery({
        queryKey: ['consulting', 'execution-evidence-status', operationId],
        queryFn: () => api.consulting.execution.evidenceStatus(operationId).then((res) => res.data),
        enabled: Boolean(operationId),
    });

    const missingEvidence = useMemo(
        () => evidenceStatus?.missingEvidenceTypes || [],
        [evidenceStatus],
    );
    const normalizedFileUrl = fileUrl.trim();
    const currentTemplateSource = EVIDENCE_TEMPLATE_SOURCES[evidenceType];
    const currentSourceAction = EVIDENCE_SOURCE_ACTIONS[evidenceType];
    const looksLikeIntermediateRoute = useMemo(
        () => INTERMEDIATE_ROUTE_SCHEMES.some((scheme) => normalizedFileUrl.startsWith(scheme)),
        [normalizedFileUrl],
    );
    const looksLikeArtifactUrl = useMemo(
        () => /^https?:\/\//.test(normalizedFileUrl),
        [normalizedFileUrl],
    );
    const recentArtifactUrls = useMemo(
        () => readArtifactHistory()[evidenceType] || [],
        [artifactHistoryRevision, evidenceType],
    );
    const executionSourceMetadata = useMemo(() => {
        const routeFlowUsed =
            Boolean(sourceLaunchStatus) ||
            Boolean(copyRouteStatus) ||
            captureCompleted;

        return {
            urlKind: looksLikeArtifactUrl
                ? 'artifact'
                : looksLikeIntermediateRoute
                    ? 'intermediate_route'
                    : 'unknown',
            routeFlowUsed,
            captureCompleted,
            selectedEvidenceType: evidenceType,
            uiComponent: 'OperationEvidencePanel',
        };
    }, [
        captureCompleted,
        copyRouteStatus,
        evidenceType,
        looksLikeArtifactUrl,
        looksLikeIntermediateRoute,
        sourceLaunchStatus,
    ]);
    const attachMutation = useMutation({
        mutationFn: async () => {
            const checksum = await sha256Hex(`${operationId}:${fileUrl}:${metaNote}:${evidenceType}`);
            const metadata: Record<string, unknown> = {
                executionSourceUi: executionSourceMetadata,
            };
            if (metaNote.trim().length > 0) {
                metadata.note = metaNote;
            }

            return api.consulting.execution.attachEvidence({
                operationId,
                evidenceType,
                fileUrl,
                capturedAt: new Date().toISOString(),
                checksum,
                metadata,
            });
        },
        onSuccess: () => {
            writeLastEvidenceSource(evidenceType, fileUrl);
            if (looksLikeArtifactUrl) {
                writeArtifactHistoryEntry(evidenceType, fileUrl);
                setArtifactHistoryRevision((current) => current + 1);
            }
            setFileUrl('');
            setMetaNote('');
            setSourceHint(`Сохранён последний источник для типа «${formatEvidenceTypeLabel(evidenceType)}».`);
            queryClient.invalidateQueries({ queryKey: ['consulting', 'execution-evidence', operationId] });
            queryClient.invalidateQueries({ queryKey: ['consulting', 'execution-evidence-status', operationId] });
            queryClient.invalidateQueries({ queryKey: ['consulting', 'active-operations'] });
        },
    });

    const applyEvidenceType = (nextEvidenceType: string, mode: 'auto' | 'manual' = 'manual') => {
        setEvidenceType(nextEvidenceType);
        setSourceLaunchStatus(null);
        setCopyRouteStatus(null);
        setCaptureCompleted(false);
        setIsClearHistoryConfirmOpen(false);

        const savedSource = readLastEvidenceSources()[nextEvidenceType];
        if (savedSource) {
            setFileUrl(savedSource);
            setSourceHint(
                mode === 'auto'
                    ? `Подставлен последний источник для типа «${formatEvidenceTypeLabel(nextEvidenceType)}».`
                    : `Для типа «${formatEvidenceTypeLabel(nextEvidenceType)}» подставлен последний использованный источник.`,
            );
            return;
        }

        const templateSource = EVIDENCE_TEMPLATE_SOURCES[nextEvidenceType];
        if (templateSource) {
            setFileUrl(templateSource);
            setSourceHint(
                mode === 'auto'
                    ? `Подставлен шаблон источника для типа «${formatEvidenceTypeLabel(nextEvidenceType)}».`
                    : `Для типа «${formatEvidenceTypeLabel(nextEvidenceType)}» подготовлен шаблон источника.`,
            );
            return;
        }

        if (mode === 'auto') {
            setFileUrl('');
        }
        setSourceHint(null);
    };

    const launchTemplateSource = () => {
        if (!currentTemplateSource) {
            return;
        }

        setFileUrl(currentTemplateSource);
        setCopyRouteStatus(null);
        setCaptureCompleted(false);
        setSourceLaunchStatus({
            tone: 'info',
            message: `Пытаемся открыть внешний источник ${currentTemplateSource}.`,
        });
        setSourceHint(
            `Запущен маршрут ${currentTemplateSource}. Если источник не открылся автоматически, URL уже подставлен в поле для ручного продолжения.`,
        );

        if (typeof window !== 'undefined') {
            let settled = false;
            let timeoutId: number | undefined;

            const cleanup = () => {
                window.removeEventListener('blur', handleExternalLaunch);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                if (typeof timeoutId === 'number') {
                    window.clearTimeout(timeoutId);
                }
            };

            const markSettled = (status: SourceLaunchStatus) => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                setSourceLaunchStatus(status);
            };

            const handleExternalLaunch = () => {
                markSettled({
                    tone: 'success',
                    message: 'Источник передан внешнему обработчику. Если экран не переключился, продолжайте вручную по уже подставленному маршруту.',
                });
            };

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    handleExternalLaunch();
                }
            };

            window.addEventListener('blur', handleExternalLaunch);
            document.addEventListener('visibilitychange', handleVisibilityChange);
            timeoutId = window.setTimeout(() => {
                markSettled({
                    tone: 'warning',
                    message: 'Автозапуск не подтверждён. Продолжайте вручную по подставленному маршруту в поле source URL.',
                });
            }, 1400);

            window.location.assign(currentTemplateSource);
        }
    };

    const copyCurrentSourceRoute = async () => {
        const route = fileUrl.trim() || currentTemplateSource;
        if (!route) {
            setCopyRouteStatus({
                tone: 'warning',
                message: 'Маршрут для копирования ещё не подготовлен.',
            });
            return;
        }

        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            setCopyRouteStatus({
                tone: 'warning',
                message: 'Clipboard API недоступен. Скопируйте маршрут вручную из поля source URL.',
            });
            return;
        }

        try {
            await navigator.clipboard.writeText(route);
            setCopyRouteStatus({
                tone: 'success',
                message: 'Маршрут скопирован. Его можно сразу передать во внешний инструмент или открыть на мобильном устройстве.',
            });
        } catch {
            setCopyRouteStatus({
                tone: 'warning',
                message: 'Не удалось скопировать автоматически. Скопируйте маршрут вручную из поля source URL.',
            });
        }
    };

    const replaceRouteWithArtifactUrl = () => {
        setFileUrl('');
        setSourceHint('Служебный route очищен. Вставьте итоговый artifact URL из внешнего инструмента.');
        setCopyRouteStatus(null);

        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                fileUrlInputRef.current?.focus();
            });
        }
    };

    const applyArtifactHistoryEntry = (entry: ArtifactHistoryEntry) => {
        setFileUrl(entry.url);
        setSourceHint(`Подставлен ранее сохранённый URL подтверждения для типа «${formatEvidenceTypeLabel(evidenceType)}».`);
        setSourceLaunchStatus(null);
        setCopyRouteStatus(null);
        setCaptureCompleted(false);

        if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                fileUrlInputRef.current?.focus();
                fileUrlInputRef.current?.select();
            });
        }
    };

    const clearArtifactHistory = () => {
        if (typeof window !== 'undefined' && undoTimeoutRef.current) {
            window.clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }

        clearArtifactHistoryForType(evidenceType);
        setArtifactHistoryRevision((current) => current + 1);
        setSourceHint(`История URL подтверждений для типа «${formatEvidenceTypeLabel(evidenceType)}» очищена.`);
        setIsClearHistoryConfirmOpen(false);
        setRemovedArtifactUndo(null);
        setUndoSecondsLeft(0);
    };

    const removeSingleArtifactHistoryEntry = (entry: ArtifactHistoryEntry) => {
        if (typeof window !== 'undefined' && undoTimeoutRef.current) {
            window.clearTimeout(undoTimeoutRef.current);
        }

        removeArtifactHistoryEntry(evidenceType, entry.url);
        setArtifactHistoryRevision((current) => current + 1);
        setSourceHint(`URL подтверждения удалён из истории для типа «${formatEvidenceTypeLabel(evidenceType)}».`);
        setRemovedArtifactUndo({
            evidenceType,
            entry,
            expiresAt: Date.now() + UNDO_WINDOW_MS,
        });
        setUndoSecondsLeft(Math.ceil(UNDO_WINDOW_MS / 1000));

        if (typeof window !== 'undefined') {
            undoTimeoutRef.current = window.setTimeout(() => {
                setRemovedArtifactUndo(null);
                setUndoSecondsLeft(0);
                undoTimeoutRef.current = null;
            }, UNDO_WINDOW_MS);
        }
    };

    const restoreRemovedArtifactHistoryEntry = () => {
        if (!removedArtifactUndo) {
            return;
        }

        if (typeof window !== 'undefined' && undoTimeoutRef.current) {
            window.clearTimeout(undoTimeoutRef.current);
            undoTimeoutRef.current = null;
        }

        upsertArtifactHistoryEntry(removedArtifactUndo.evidenceType, removedArtifactUndo.entry);
        setArtifactHistoryRevision((current) => current + 1);
        setSourceHint(`URL подтверждения восстановлен в истории для типа «${formatEvidenceTypeLabel(removedArtifactUndo.evidenceType)}».`);
        setRemovedArtifactUndo(null);
        setUndoSecondsLeft(0);
    };

    useEffect(() => {
        if (preferredEvidenceType && EVIDENCE_TYPES.includes(preferredEvidenceType)) {
            applyEvidenceType(preferredEvidenceType, 'auto');
        }
    }, [preferredEvidenceType]);

    useEffect(() => {
        const route = normalizedFileUrl || currentTemplateSource;
        if (sourceLaunchStatus?.tone !== 'warning' || !route) {
            setQrSvg(null);
            setCaptureCompleted(false);
            return;
        }

        let isActive = true;
        QRCode.toString(route, {
            type: 'svg',
            width: 176,
            margin: 1,
            color: {
                dark: '#92400e',
                light: '#ffffff',
            },
        })
            .then((svg: string) => {
                if (isActive) {
                    setQrSvg(svg);
                }
            })
            .catch(() => {
                if (isActive) {
                    setQrSvg(null);
                }
            });

        return () => {
            isActive = false;
        };
    }, [currentTemplateSource, normalizedFileUrl, sourceLaunchStatus?.tone]);

    useEffect(() => {
        if (!captureCompleted) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            fileUrlInputRef.current?.focus();
            fileUrlInputRef.current?.select();
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [captureCompleted]);

    useEffect(() => {
        if (!removedArtifactUndo) {
            setUndoSecondsLeft(0);
            return;
        }

        const updateCountdown = () => {
            const remainingMs = removedArtifactUndo.expiresAt - Date.now();
            const nextSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
            setUndoSecondsLeft(nextSeconds);
        };

        updateCountdown();
        const intervalId = window.setInterval(updateCountdown, 250);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [removedArtifactUndo]);

    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && undoTimeoutRef.current) {
                window.clearTimeout(undoTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div id={panelId} className="space-y-4">
            <div className="rounded-xl border border-black/5 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                            Состояние подтверждений
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                            {isStatusLoading ? 'Проверка...' : evidenceStatus?.isComplete ? 'Подтверждений достаточно для обязательного сценария' : 'Нужны дополнительные подтверждения'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs text-slate-600 border border-black/5">
                        {evidenceStatus?.isComplete ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
                        {evidenceStatus?.isComplete ? 'Готово' : 'Ожидание'}
                    </div>
                </div>
                {missingEvidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {missingEvidence.map((item: string) => (
                            <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700 border border-amber-100">
                                не хватает: {formatEvidenceTypeLabel(item)}
                            </span>
                        ))}
                    </div>
                )}
                {Array.isArray(evidenceStatus?.presentEvidenceTypes) && evidenceStatus.presentEvidenceTypes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {evidenceStatus.presentEvidenceTypes.map((item: string) => (
                            <span key={item} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                                есть: {formatEvidenceTypeLabel(item)}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-4 space-y-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Прикрепить подтверждение
                </p>
                {preferredEvidenceType && (
                    <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                        Подготовлен тип подтверждения: <span className="font-medium">{formatEvidenceTypeLabel(preferredEvidenceType)}</span>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                        className={`h-11 px-4 bg-white border rounded-xl text-sm text-slate-900 outline-none ${preferredEvidenceType ? 'border-sky-200 ring-2 ring-sky-100' : 'border-black/5'}`}
                        value={evidenceType}
                        onChange={(e) => applyEvidenceType(e.target.value, 'manual')}
                    >
                        {EVIDENCE_TYPES.map((item) => (
                            <option key={item} value={item}>
                                {formatEvidenceTypeLabel(item)}
                            </option>
                        ))}
                    </select>
                    <Input
                        ref={fileUrlInputRef}
                        value={fileUrl}
                        onChange={(e) => {
                            setFileUrl(e.target.value);
                            setSourceHint(null);
                        }}
                        className="h-11 bg-white border-black/5"
                        placeholder={EVIDENCE_PLACEHOLDERS[evidenceType] || 'https://.../proof-file'}
                    />
                </div>
                {captureCompleted && normalizedFileUrl.length > 0 && looksLikeIntermediateRoute && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-xs text-amber-700">
                                Похоже, сейчас в поле указан промежуточный маршрут вроде `camera://` или `weather-api://`. Для прикрепления нужен итоговый URL подтверждения, который вернул внешний инструмент.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100/70"
                                onClick={replaceRouteWithArtifactUrl}
                            >
                                <Link2 className="w-4 h-4" />
                                Заменить маршрут на URL подтверждения
                            </Button>
                        </div>
                    </div>
                )}
                {captureCompleted && normalizedFileUrl.length > 0 && looksLikeArtifactUrl && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        `source URL` похож на итоговый URL подтверждения. Можно завершать прикрепление подтверждения.
                    </div>
                )}
                {removedArtifactUndo && removedArtifactUndo.evidenceType === evidenceType && (
                    <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-sky-800">
                                    URL подтверждения удалён из истории
                                </p>
                                <p className="mt-1 break-all font-mono text-[10px] text-sky-700/90">
                                    {removedArtifactUndo.entry.url}
                                </p>
                                <p className="mt-1 text-[11px] text-sky-700">
                                    Запись можно восстановить ещё {undoSecondsLeft} сек.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl border-sky-200 bg-white text-sky-700 hover:bg-sky-100/70"
                                onClick={restoreRemovedArtifactHistoryEntry}
                            >
                                Восстановить
                            </Button>
                        </div>
                    </div>
                )}
                {recentArtifactUrls.length > 0 && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-800">
                                Последние URL подтверждений
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100/70"
                                onClick={() => setIsClearHistoryConfirmOpen((current) => !current)}
                            >
                                {isClearHistoryConfirmOpen ? 'Скрыть подтверждение' : 'Очистить историю'}
                            </Button>
                        </div>
                        {isClearHistoryConfirmOpen && (
                            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                                <p className="text-xs font-medium text-amber-800">
                                    Подтвердите очистку истории URL подтверждений для типа
                                    {' '}
                                    <span className="font-semibold">«{formatEvidenceTypeLabel(evidenceType)}»</span>
                                </p>
                                <p className="mt-1 text-[11px] text-amber-700">
                                    Будут удалены следующие сохранённые URL подтверждений:
                                </p>
                                <div className="mt-3 space-y-2">
                                    {recentArtifactUrls.map((entry) => (
                                        <div
                                            key={`confirm:${entry.url}:${entry.savedAt}`}
                                            className="rounded-xl border border-amber-100 bg-white px-3 py-2"
                                        >
                                            <p className="break-all font-mono text-[10px] text-amber-800/90">
                                                {entry.url}
                                            </p>
                                            <p className="mt-1 text-[11px] text-amber-700">
                                                Сохранён: {new Date(entry.savedAt).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2 rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100/70"
                                        onClick={clearArtifactHistory}
                                    >
                                        Подтвердить очистку
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2 rounded-xl border-black/10 bg-white text-slate-700 hover:bg-slate-100"
                                        onClick={() => setIsClearHistoryConfirmOpen(false)}
                                    >
                                        Отмена
                                    </Button>
                                </div>
                            </div>
                        )}
                        <div className="mt-3 space-y-2">
                            {recentArtifactUrls.map((entry) => (
                                <div
                                    key={`${entry.url}:${entry.savedAt}`}
                                    className="rounded-xl border border-emerald-100 bg-white px-3 py-3"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <p className="break-all font-mono text-[10px] text-emerald-800/90">
                                                {entry.url}
                                            </p>
                                            <p className="mt-1 text-[11px] text-emerald-700">
                                                Сохранён: {new Date(entry.savedAt).toLocaleString('ru-RU')}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="gap-2 rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100/70"
                                            onClick={() => applyArtifactHistoryEntry(entry)}
                                        >
                                            <Link2 className="w-4 h-4" />
                                            Подставить
                                        </Button>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="gap-2 rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
                                            onClick={() => removeSingleArtifactHistoryEntry(entry)}
                                        >
                                            Удалить URL
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {currentTemplateSource && currentSourceAction && (
                    <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-medium text-violet-800">
                                    {currentSourceAction.label}
                                </p>
                                <p className="mt-1 text-[11px] text-violet-700">
                                    {currentSourceAction.description}
                                </p>
                                <p className="mt-2 break-all font-mono text-[10px] text-violet-700/90">
                                    {currentTemplateSource}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl border-violet-200 bg-white text-violet-700 hover:bg-violet-100/70"
                                onClick={launchTemplateSource}
                            >
                                <Link2 className="w-4 h-4" />
                                {currentSourceAction.label}
                            </Button>
                        </div>
                    </div>
                )}
                {sourceLaunchStatus && (
                    <div
                        className={`rounded-xl px-3 py-2 text-xs ${
                            sourceLaunchStatus.tone === 'success'
                                ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                                : sourceLaunchStatus.tone === 'warning'
                                    ? 'border border-amber-100 bg-amber-50 text-amber-700'
                                    : 'border border-sky-100 bg-sky-50 text-sky-700'
                        }`}
                    >
                        {sourceLaunchStatus.message}
                    </div>
                )}
                {sourceLaunchStatus?.tone === 'warning' && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs font-medium text-amber-800">
                                    Резервный маршрут для ручного продолжения
                                </p>
                                <p className="mt-1 text-[11px] text-amber-700">
                                    Скопируйте текущий route и передайте его во внешний инструмент, если браузер не открыл custom scheme.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="gap-2 rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100/70"
                                onClick={() => {
                                    void copyCurrentSourceRoute();
                                }}
                            >
                                <Link2 className="w-4 h-4" />
                                Скопировать route
                            </Button>
                        </div>
                        {qrSvg && (
                            <div className="mt-3 rounded-xl border border-amber-100 bg-white p-3">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                    <div
                                        className="mx-auto h-44 w-44 shrink-0 overflow-hidden rounded-xl border border-amber-100 bg-white p-2 md:mx-0"
                                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-amber-800">
                                            QR для быстрого переноса на мобильное устройство
                                        </p>
                                        <p className="mt-1 text-[11px] text-amber-700">
                                            Откройте QR на телефоне и продолжите сбор подтверждения во внешнем инструменте, если браузер на компьютере не перехватывает специальную схему.
                                        </p>
                                        <p className="mt-2 break-all font-mono text-[10px] text-amber-700/90">
                                            {normalizedFileUrl || currentTemplateSource}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-amber-800">
                                        Контрольный список передачи
                                    </p>
                                    <div className="mt-2 space-y-2 text-xs text-amber-700">
                                        <p>1. Откройте QR на мобильном устройстве или полевом терминале.</p>
                                        <p>2. Завершите capture во внешнем инструменте по открытому маршруту.</p>
                                        <p>3. Вернитесь в эту форму и прикрепите полученный URL как подтверждение.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {copyRouteStatus && (
                            <div
                                className={`mt-3 rounded-xl px-3 py-2 text-xs ${
                                    copyRouteStatus.tone === 'success'
                                        ? 'border border-emerald-100 bg-emerald-50 text-emerald-700'
                                        : 'border border-amber-100 bg-white text-amber-700'
                                }`}
                            >
                                {copyRouteStatus.message}
                            </div>
                        )}
                        <div className="mt-3 rounded-xl border border-amber-100 bg-white px-3 py-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-medium text-amber-800">
                                        Сбор завершён
                                    </p>
                                        <p className="mt-1 text-[11px] text-amber-700">
                                            Отметьте завершение полевого сбора, чтобы панель перевела вас к финальному шагу прикрепления итогового URL.
                                        </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={`gap-2 rounded-xl ${
                                        captureCompleted
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                                            : 'border-amber-200 bg-white text-amber-700 hover:bg-amber-100/70'
                                    }`}
                                    onClick={() => setCaptureCompleted((current) => !current)}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {captureCompleted ? 'Сбор подтверждён' : 'Отметить завершение сбора'}
                                </Button>
                            </div>
                            {captureCompleted && (
                                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-xs text-emerald-700">
                                    <p className="font-medium text-emerald-800">
                                        Финальный шаг
                                    </p>
                                    <p className="mt-1">
                                        Вставьте или проверьте итоговый `source URL` в поле выше, затем нажмите `Прикрепить подтверждение по URL`.
                                    </p>
                                    <p className="mt-2 break-all font-mono text-[10px] text-emerald-700/90">
                                        Текущий route: {normalizedFileUrl || currentTemplateSource}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {sourceHint && (
                    <div className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                        {sourceHint}
                    </div>
                )}
                <Input
                    value={metaNote}
                    onChange={(e) => setMetaNote(e.target.value)}
                    className="h-11 bg-white border-black/5"
                    placeholder="Краткая заметка к подтверждению"
                />
                <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 rounded-xl"
                    disabled={attachMutation.isPending || normalizedFileUrl.length === 0}
                    onClick={() => attachMutation.mutate()}
                >
                    {attachMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    Прикрепить подтверждение по URL
                </Button>
            </div>

            <div className="rounded-xl border border-black/5 bg-white p-4">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Уже прикреплено
                </p>
                {isEvidenceLoading ? (
                    <p className="text-xs text-slate-500">Загрузка подтверждений...</p>
                ) : Array.isArray(evidence) && evidence.length > 0 ? (
                    <div className="space-y-2">
                        {evidence.map((item: any) => (
                            <div key={item.id} className="rounded-xl border border-black/5 bg-slate-50 px-3 py-2">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-medium text-slate-900">{formatEvidenceTypeLabel(item.evidenceType)}</p>
                                    <p className="text-[10px] text-slate-500">
                                        {item.capturedAt ? new Date(item.capturedAt).toLocaleString('ru-RU') : '-'}
                                    </p>
                                </div>
                                {item.sourceAudit && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${
                                            item.sourceAudit.urlKind === 'artifact'
                                                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                                                : item.sourceAudit.urlKind === 'intermediate_route'
                                                    ? 'border-amber-100 bg-amber-50 text-amber-700'
                                                    : 'border-slate-200 bg-slate-100 text-slate-700'
                                        }`}>
                                            {item.sourceAudit.urlKind === 'artifact'
                                                ? 'artifact'
                                                : item.sourceAudit.urlKind === 'intermediate_route'
                                                    ? 'route'
                                                    : 'неизвестно'}
                                        </span>
                                        {item.sourceAudit.sourceScheme && (
                                            <span className="rounded-full border border-black/5 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
                                                схема: {item.sourceAudit.sourceScheme}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <a
                                    href={item.fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 block text-xs text-blue-600 hover:underline break-all"
                                >
                                    {item.fileUrl}
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-500">По этой операции подтверждения пока не прикреплены.</p>
                )}
            </div>
        </div>
    );
}
