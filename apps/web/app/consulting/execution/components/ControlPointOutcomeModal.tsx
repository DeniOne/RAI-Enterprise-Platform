'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ClipboardPlus, GitBranchPlus, Loader2, ShieldAlert, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { OperationEvidencePanel } from './OperationEvidencePanel';
import { OperationActivityTimeline } from './OperationActivityTimeline';
import { EvidenceGuardBanner } from './EvidenceGuardBanner';
import { api } from '@/lib/api';
import {
    formatChangeOrderTypeLabel,
    formatEvidenceIntegrityLabel,
    formatObservationIntentLabel,
    formatObservationTypeLabel,
    formatOutcomeLabel,
    formatSeverityLabel,
} from '@/lib/ui-language';

interface ControlPointOutcomeModalProps {
    operation: any;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    isSubmitting: boolean;
}

const OUTCOME_OPTIONS = [
    { value: 'PASS', label: formatOutcomeLabel('PASS') },
    { value: 'WARNING', label: formatOutcomeLabel('WARNING') },
    { value: 'FAIL', label: formatOutcomeLabel('FAIL') },
    { value: 'BLOCKED', label: formatOutcomeLabel('BLOCKED') },
];

const SEVERITY_OPTIONS = [
    { value: 'INFO', label: formatSeverityLabel('INFO') },
    { value: 'WARNING', label: formatSeverityLabel('WARNING') },
    { value: 'CRITICAL', label: formatSeverityLabel('CRITICAL') },
    { value: 'BLOCKER', label: formatSeverityLabel('BLOCKER') },
];

const CHANGE_ORDER_OPTIONS = [
    { value: 'SHIFT_DATE', label: formatChangeOrderTypeLabel('SHIFT_DATE') },
    { value: 'CHANGE_INPUT', label: formatChangeOrderTypeLabel('CHANGE_INPUT') },
    { value: 'CHANGE_RATE', label: formatChangeOrderTypeLabel('CHANGE_RATE') },
    { value: 'CANCEL_OP', label: formatChangeOrderTypeLabel('CANCEL_OP') },
    { value: 'ADD_OP', label: formatChangeOrderTypeLabel('ADD_OP') },
];

const OBSERVATION_TYPE_OPTIONS = [
    { value: 'PHOTO', label: formatObservationTypeLabel('PHOTO') },
    { value: 'MEASUREMENT', label: formatObservationTypeLabel('MEASUREMENT') },
    { value: 'VOICE_NOTE', label: formatObservationTypeLabel('VOICE_NOTE') },
    { value: 'GEO_WALK', label: formatObservationTypeLabel('GEO_WALK') },
    { value: 'SOS_SIGNAL', label: formatObservationTypeLabel('SOS_SIGNAL') },
    { value: 'CALL_LOG', label: formatObservationTypeLabel('CALL_LOG') },
];

const OBSERVATION_INTENT_OPTIONS = [
    { value: 'MONITORING', label: formatObservationIntentLabel('MONITORING') },
    { value: 'INCIDENT', label: formatObservationIntentLabel('INCIDENT') },
    { value: 'CONSULTATION', label: formatObservationIntentLabel('CONSULTATION') },
    { value: 'CONFIRMATION', label: formatObservationIntentLabel('CONFIRMATION') },
    { value: 'DELAY', label: formatObservationIntentLabel('DELAY') },
    { value: 'CALL', label: formatObservationIntentLabel('CALL') },
];

const INTEGRITY_STATUS_OPTIONS = [
    { value: 'WEAK_EVIDENCE', label: formatEvidenceIntegrityLabel('WEAK_EVIDENCE') },
    { value: 'STRONG_EVIDENCE', label: formatEvidenceIntegrityLabel('STRONG_EVIDENCE') },
    { value: 'NO_EVIDENCE', label: formatEvidenceIntegrityLabel('NO_EVIDENCE') },
];

export const ControlPointOutcomeModal: React.FC<ControlPointOutcomeModalProps> = ({
    operation,
    isOpen,
    onClose,
    onConfirm,
    isSubmitting,
}) => {
    const operationId = operation?.id;
    const evidencePanelId = `control-point-evidence-panel-${operationId}`;
    const controlPoints = operation?.mapStage?.controlPoints || [];
    const defaultControlPointId = controlPoints[0]?.id || '';

    const [controlPointId, setControlPointId] = useState(defaultControlPointId);
    const [outcome, setOutcome] = useState('PASS');
    const [severity, setSeverity] = useState('INFO');
    const [summary, setSummary] = useState('');
    const [completeOperation, setCompleteOperation] = useState(false);
    const [decisiveAction, setDecisiveAction] = useState(false);
    const [openChangeOrder, setOpenChangeOrder] = useState(false);
    const [changeType, setChangeType] = useState('CHANGE_INPUT');
    const [deltaCostRub, setDeltaCostRub] = useState('');
    const [createObservation, setCreateObservation] = useState(false);
    const [observationType, setObservationType] = useState('PHOTO');
    const [observationIntent, setObservationIntent] = useState('MONITORING');
    const [observationIntegrityStatus, setObservationIntegrityStatus] = useState('WEAK_EVIDENCE');
    const [observationContent, setObservationContent] = useState('');
    const [observationPhotoUrl, setObservationPhotoUrl] = useState('');
    const [observationVoiceUrl, setObservationVoiceUrl] = useState('');
    const [targetEvidenceType, setTargetEvidenceType] = useState<string | null>(null);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [isPreparingObservation, setIsPreparingObservation] = useState(false);

    useEffect(() => {
        setControlPointId(defaultControlPointId);
        setOutcome('PASS');
        setSeverity('INFO');
        setSummary('');
        setCompleteOperation(false);
        setDecisiveAction(false);
        setOpenChangeOrder(false);
        setChangeType('CHANGE_INPUT');
        setDeltaCostRub('');
        setCreateObservation(false);
        setObservationType('PHOTO');
        setObservationIntent('MONITORING');
        setObservationIntegrityStatus('WEAK_EVIDENCE');
        setObservationContent('');
        setObservationPhotoUrl('');
        setObservationVoiceUrl('');
        setTargetEvidenceType(null);
        setSubmissionError(null);
        setIsPreparingObservation(false);
    }, [defaultControlPointId, operation?.id, isOpen]);

    const selectedControlPoint = useMemo(
        () => controlPoints.find((point: any) => point.id === controlPointId) || controlPoints[0] || null,
        [controlPointId, controlPoints],
    );

    const hasObservationPayload = Boolean(
        observationContent.trim() ||
        observationPhotoUrl.trim() ||
        observationVoiceUrl.trim(),
    );

    const evidenceGuardRequired =
        severity === 'CRITICAL' ||
        severity === 'BLOCKER' ||
        decisiveAction ||
        openChangeOrder ||
        completeOperation;

    const { data: evidenceStatus, isLoading: isEvidenceStatusLoading } = useQuery({
        queryKey: ['consulting', 'execution-evidence-status', operationId],
        queryFn: () => api.consulting.execution.evidenceStatus(operationId).then((res) => res.data),
        enabled: Boolean(operationId) && isOpen,
        initialData: operation?.evidenceSummary,
    });

    if (!isOpen || !operation) return null;

    const missingEvidenceTypes = evidenceStatus?.missingEvidenceTypes || [];
    const isEvidenceBlocking =
        evidenceGuardRequired &&
        Boolean(evidenceStatus) &&
        !evidenceStatus.isComplete;

    const handleSelectMissingEvidenceType = (evidenceType: string) => {
        setTargetEvidenceType(evidenceType);
        requestAnimationFrame(() => {
            document.getElementById(evidencePanelId)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        });
    };

    const handleConfirm = async () => {
        try {
            setSubmissionError(null);
            setIsPreparingObservation(true);

            if (isEvidenceBlocking) {
                setSubmissionError(
                    `Результат заблокирован до прикрепления подтверждений: ${missingEvidenceTypes.join(', ')}`,
                );
                setIsPreparingObservation(false);
                return;
            }

            let observationId: string | undefined;

            if (createObservation) {
                if (!hasObservationPayload) {
                    setSubmissionError('Для полевого наблюдения добавьте заметку, ссылку на фото или ссылку на голосовую запись.');
                    setIsPreparingObservation(false);
                    return;
                }

                const observationResponse = await api.consulting.execution.createObservation({
                    operationId: operation.id,
                    type: observationType,
                    intent: observationIntent,
                    integrityStatus: observationIntegrityStatus,
                    content: observationContent.trim() || undefined,
                    photoUrl: observationPhotoUrl.trim() || undefined,
                    voiceUrl: observationVoiceUrl.trim() || undefined,
                });

                observationId = observationResponse.data?.id;
            }

            onConfirm({
            techMapId: operation.mapStage?.techMap?.id,
            controlPointId,
            payload: {
                outcome,
                severity,
                summary,
                observationId,
                operationId: operation.id,
                completeOperation,
                decisiveAction,
                recommendationTitle: `Результат по ${selectedControlPoint?.name || 'контрольной точке'}`,
                recommendationMessage: summary,
                decisionGateTitle:
                    severity === 'CRITICAL' || severity === 'BLOCKER' || decisiveAction || openChangeOrder
                        ? `Управляемая проверка: ${selectedControlPoint?.name || 'контрольная точка'}`
                        : undefined,
                changeOrder: openChangeOrder
                    ? {
                        changeType,
                        diffPayload: {
                            source: 'execution_ui',
                            operationId: operation.id,
                            controlPointName: selectedControlPoint?.name || null,
                        },
                        deltaCostRub: deltaCostRub ? Number(deltaCostRub) : undefined,
                    }
                    : undefined,
            },
        });
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Не удалось создать полевое наблюдение для результата исполнения.';
            setSubmissionError(Array.isArray(message) ? message.join('; ') : String(message));
        } finally {
            setIsPreparingObservation(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#FAFAFA] border border-black/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-black/5 bg-white">
                    <div>
                        <h2 className="text-lg font-medium text-slate-900">Фиксация результата по контрольной точке</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{operation.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Контрольная точка
                            </label>
                            <select
                                className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                value={controlPointId}
                                onChange={(e) => setControlPointId(e.target.value)}
                            >
                                {controlPoints.map((point: any) => (
                                    <option key={point.id} value={point.id}>
                                        {point.name}
                                    </option>
                                ))}
                            </select>
                            {selectedControlPoint?.outcomeExplanations?.[0] && (
                                <p className="mt-2 text-xs text-slate-500">
                                    Последний результат: {formatSeverityLabel(selectedControlPoint.outcomeExplanations[0].severity)} / {selectedControlPoint.outcomeExplanations[0].summary}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Результат
                            </label>
                            <select
                                className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                            >
                                {OUTCOME_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Серьёзность
                            </label>
                            <select
                                className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                value={severity}
                                onChange={(e) => setSeverity(e.target.value)}
                            >
                                {SEVERITY_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="p-4 bg-white rounded-xl border border-black/5">
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                Политика подтверждений
                            </p>
                            <div className="flex items-start gap-2 text-xs text-slate-600">
                                <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600" />
                                <p>Критичные исходы, решающее действие, изменение и закрытие операции используют обязательную проверку подтверждений по операции.</p>
                            </div>
                        </div>
                    </div>

                    {evidenceGuardRequired && (
                        <EvidenceGuardBanner
                            title="Проверка перед управляемым результатом"
                            loading={isEvidenceStatusLoading}
                            isBlocking={isEvidenceBlocking}
                            readyText="Подтверждений достаточно для выбранного результата."
                        blockedText="Результат не будет отправлен, пока не прикреплены обязательные подтверждения."
                        missingEvidenceTypes={missingEvidenceTypes}
                        requiredCount={evidenceStatus?.requiredEvidenceTypes?.length}
                        presentCount={evidenceStatus?.presentEvidenceTypes?.length}
                        onSelectMissingEvidenceType={handleSelectMissingEvidenceType}
                    />
                    )}

                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                            Сводка
                        </label>
                        <textarea
                            className="w-full h-28 p-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none resize-none"
                            placeholder="Что произошло на контрольной точке и почему это важно для исполнения?"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-sky-50 rounded-xl border border-sky-100">
                        <input
                            type="checkbox"
                            checked={createObservation}
                            onChange={(e) => setCreateObservation(e.target.checked)}
                            className="mt-1"
                        />
                        <div>
                            <p className="text-sm font-medium text-sky-950 flex items-center gap-2">
                                <ClipboardPlus className="w-4 h-4" /> Создать полевое наблюдение
                            </p>
                            <p className="text-xs text-sky-700 mt-1">
                                Наблюдение будет создано в контуре исполнения и привязано к результату через `observationId`.
                            </p>
                        </div>
                    </label>

                    {createObservation && (
                        <div className="rounded-2xl border border-sky-100 bg-white p-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                        Тип наблюдения
                                    </label>
                                    <select
                                        className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                        value={observationType}
                                        onChange={(e) => setObservationType(e.target.value)}
                                    >
                                        {OBSERVATION_TYPE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                        Назначение
                                    </label>
                                    <select
                                        className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                        value={observationIntent}
                                        onChange={(e) => setObservationIntent(e.target.value)}
                                    >
                                        {OBSERVATION_INTENT_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                        Качество подтверждения
                                    </label>
                                    <select
                                        className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                        value={observationIntegrityStatus}
                                        onChange={(e) => setObservationIntegrityStatus(e.target.value)}
                                    >
                                        {INTEGRITY_STATUS_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                    Заметка по наблюдению
                                </label>
                                <textarea
                                    className="w-full h-24 p-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none resize-none"
                                    placeholder="Что именно наблюдалось в поле и почему это наблюдение важно для контрольной точки?"
                                    value={observationContent}
                                    onChange={(e) => setObservationContent(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    value={observationPhotoUrl}
                                    onChange={(e) => setObservationPhotoUrl(e.target.value)}
                                    className="h-11 bg-white border-black/5"
                                    placeholder="https://.../observation-photo.jpg"
                                />
                                <Input
                                    value={observationVoiceUrl}
                                    onChange={(e) => setObservationVoiceUrl(e.target.value)}
                                    className="h-11 bg-white border-black/5"
                                    placeholder="https://.../observation-voice.mp3"
                                />
                            </div>

                            <p className="text-xs text-slate-500">
                                Наблюдение требует хотя бы заметку, ссылку на фото или ссылку на голосовую запись. Поле и сезон будут взяты из контекста исполнения операции.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black/5">
                            <input
                                type="checkbox"
                                checked={completeOperation}
                                onChange={(e) => setCompleteOperation(e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm font-medium text-slate-900">Закрыть операцию как завершённую</p>
                                <p className="text-xs text-slate-500 mt-1">Использует проверку подтверждений и обновляет запись исполнения.</p>
                            </div>
                        </label>
                        <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-black/5">
                            <input
                                type="checkbox"
                                checked={decisiveAction}
                                onChange={(e) => setDecisiveAction(e.target.checked)}
                                className="mt-1"
                            />
                            <div>
                                <p className="text-sm font-medium text-slate-900">Решающее агрономическое действие</p>
                                <p className="text-xs text-slate-500 mt-1">Откроет управляемый маршрут проверки через `DecisionGate`.</p>
                            </div>
                        </label>
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <input
                            type="checkbox"
                            checked={openChangeOrder}
                            onChange={(e) => setOpenChangeOrder(e.target.checked)}
                            className="mt-1"
                        />
                        <div>
                            <p className="text-sm font-medium text-amber-900 flex items-center gap-2">
                                <GitBranchPlus className="w-4 h-4" /> Создать изменение
                            </p>
                            <p className="text-xs text-amber-700 mt-1">Запустит маршрут согласования после фиксации результата.</p>
                        </div>
                    </label>

                    {openChangeOrder && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                    Тип изменения
                                </label>
                                <select
                                    className="w-full h-11 px-4 bg-white border border-black/5 rounded-xl text-sm text-slate-900 outline-none"
                                    value={changeType}
                                    onChange={(e) => setChangeType(e.target.value)}
                                >
                                    {CHANGE_ORDER_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                                    Изменение стоимости, RUB
                                </label>
                                <Input
                                    type="number"
                                    value={deltaCostRub}
                                    onChange={(e) => setDeltaCostRub(e.target.value)}
                                    className="h-11 bg-white border-black/5"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Подтверждения
                        </label>
                        <OperationEvidencePanel
                            operation={operation}
                            preferredEvidenceType={targetEvidenceType}
                            panelId={evidencePanelId}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
                            Лента исполнения
                        </label>
                        <OperationActivityTimeline operation={operation} limit={6} />
                    </div>

                    {submissionError && (
                        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                            {submissionError}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t border-black/5 flex gap-3">
                    <Button variant="ghost" className="flex-1 text-slate-500 text-xs hover:bg-slate-50" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button
                        className="flex-1 bg-slate-900 hover:bg-black text-white gap-2 h-10 text-xs rounded-xl"
                        onClick={handleConfirm}
                        disabled={isSubmitting || isPreparingObservation || isEvidenceStatusLoading || isEvidenceBlocking || !controlPointId || summary.trim().length === 0}
                    >
                        {isPreparingObservation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : severity === 'CRITICAL' || severity === 'BLOCKER' ? (
                            <AlertTriangle className="w-4 h-4" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        Зафиксировать результат
                    </Button>
                </div>
            </div>
        </div>
    );
};
