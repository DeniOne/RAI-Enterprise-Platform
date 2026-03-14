'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type MapResource = {
    id: string;
    type: string;
    name: string;
    amount: number;
    unit: string;
};

type MapOperation = {
    id: string;
    name: string;
    description?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    durationHours?: number;
    resources: MapResource[];
};

type MapStage = {
    id: string;
    name: string;
    sequence: number;
    aplStageId?: string;
    operations: MapOperation[];
};

type TechMap = {
    id: string;
    seasonId?: string | null;
    harvestPlanId?: string;
    crop?: string;
    status: string;
    version: number;
    updatedAt?: string;
    generationMetadata?: {
        blueprintVersion?: string;
        source?: string;
        targetYieldTHa?: number;
    } | null;
    stages: MapStage[];
};

function nextStatuses(current: string): string[] {
    if (current === 'GENERATED_DRAFT' || current === 'DRAFT') return ['REVIEW'];
    if (current === 'REVIEW') return ['APPROVED'];
    if (current === 'APPROVED') return ['ACTIVE'];
    if (current === 'ACTIVE') return ['ARCHIVED'];
    return [];
}

export default function TechMapDetailPage({ params }: { params: { id: string } }) {
    const [techMap, setTechMap] = useState<TechMap | null>(null);
    const [loading, setLoading] = useState(true);
    const [busyStatus, setBusyStatus] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const response = await api.consulting.techmaps.get(params.id);
            setTechMap(response.data);
        } catch (error) {
            console.error('Failed to load tech map:', error);
            setTechMap(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [params.id]);

    const counters = useMemo(() => {
        const stages = techMap?.stages || [];
        const operations = stages.flatMap((stage) => stage.operations);
        const resources = operations.flatMap((operation) => operation.resources);

        return {
            stages: stages.length,
            operations: operations.length,
            resources: resources.length,
        };
    }, [techMap]);

    const handleTransition = async (targetStatus: string) => {
        if (!techMap) return;

        setBusyStatus(targetStatus);
        try {
            await api.consulting.techmaps.transition(techMap.id, targetStatus);
            await load();
        } catch (error: any) {
            console.error('Failed to transition tech map:', error);
            alert(error?.response?.data?.message || 'Ошибка перехода техкарты');
        } finally {
            setBusyStatus(null);
        }
    };

    return (
        <div className='space-y-6'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h1 className='text-xl font-medium text-gray-900'>Технологическая карта</h1>
                    <p className='text-sm text-gray-500'>Просмотр состава карты, статусов и переход к исполнению.</p>
                </div>
                <div className='flex items-center gap-3'>
                    {techMap?.harvestPlanId && (
                        <Link href={`/consulting/plans/${techMap.harvestPlanId}`} className='text-sm text-blue-600 hover:underline'>
                            План
                        </Link>
                    )}
                    <Link href='/consulting/techmaps' className='text-sm text-blue-600 hover:underline'>
                        {'<- Назад к техкартам'}
                    </Link>
                </div>
            </div>

            {loading ? (
                <Card>
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                </Card>
            ) : !techMap ? (
                <Card>
                    <p className='text-sm text-gray-500'>Техкарта не найдена.</p>
                </Card>
            ) : (
                <>
                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Культура</p>
                            <p className='font-semibold'>{(techMap.crop || 'unknown').toUpperCase()}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Статус</p>
                            <p className='font-semibold'>{techMap.status}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Версия</p>
                            <p className='font-semibold'>v{techMap.version}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Обновлена</p>
                            <p className='font-semibold'>
                                {techMap.updatedAt ? new Date(techMap.updatedAt).toLocaleString('ru-RU') : '-'}
                            </p>
                        </Card>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Стадии</p>
                            <p className='text-2xl font-semibold'>{counters.stages}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Операции</p>
                            <p className='text-2xl font-semibold'>{counters.operations}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Ресурсы</p>
                            <p className='text-2xl font-semibold'>{counters.resources}</p>
                        </Card>
                        <Card>
                            <p className='text-xs text-gray-500 mb-1'>Blueprint</p>
                            <p className='font-semibold'>{techMap.generationMetadata?.blueprintVersion || '-'}</p>
                            <p className='text-xs text-gray-500 mt-1'>{techMap.generationMetadata?.source || '-'}</p>
                        </Card>
                    </div>

                    <Card>
                        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                            <div>
                                <p className='text-xs text-gray-500 mb-1'>Статусные действия</p>
                                <p className='text-sm text-gray-600'>Переведите карту в `ACTIVE`, чтобы операции появились в execution-хабе.</p>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                                {nextStatuses(techMap.status).map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleTransition(status)}
                                        disabled={busyStatus !== null}
                                        className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                    >
                                        {busyStatus === status ? 'Обновление...' : `-> ${status}`}
                                    </button>
                                ))}
                                {techMap.status === 'ACTIVE' && (
                                    <Link
                                        href='/consulting/execution'
                                        className='px-4 py-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-semibold'
                                    >
                                        Открыть execution
                                    </Link>
                                )}
                            </div>
                        </div>
                    </Card>

                    <div className='space-y-6'>
                        {techMap.stages.map((stage) => (
                            <div key={stage.id} className='relative pl-8 border-l-2 border-gray-100 pb-12 last:pb-0'>
                                <div className='absolute left-[-9px] top-0 h-4 w-4 bg-black rounded-full ring-4 ring-white' />

                                <div className='space-y-4'>
                                    <div>
                                        <h2 className='text-lg font-medium text-gray-900'>{stage.sequence}. {stage.name}</h2>
                                        <p className='text-xs text-gray-500 mt-1'>{stage.aplStageId || 'APL stage не задан'}</p>
                                    </div>

                                    <div className='grid grid-cols-1 gap-4'>
                                        {stage.operations.map((operation) => (
                                            <Card key={operation.id} className='p-6 rounded-2xl'>
                                                <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                                                    <div>
                                                        <h3 className='font-medium text-base text-gray-900'>{operation.name}</h3>
                                                        {operation.description && (
                                                            <p className='text-sm text-gray-500 mt-1'>{operation.description}</p>
                                                        )}
                                                    </div>
                                                    <div className='text-xs text-gray-500 min-w-56'>
                                                        <p>Старт: {operation.plannedStartTime ? new Date(operation.plannedStartTime).toLocaleString('ru-RU') : '-'}</p>
                                                        <p>Финиш: {operation.plannedEndTime ? new Date(operation.plannedEndTime).toLocaleString('ru-RU') : '-'}</p>
                                                        <p>Длительность: {operation.durationHours ?? '-'} ч</p>
                                                    </div>
                                                </div>

                                                {operation.resources.length > 0 && (
                                                    <div className='mt-4 pt-4 border-t border-gray-50'>
                                                        <h4 className='text-xs font-medium text-gray-400 uppercase tracking-wider mb-3'>
                                                            Ресурсы
                                                        </h4>
                                                        <div className='flex flex-wrap gap-2'>
                                                            {operation.resources.map((resource) => (
                                                                <div
                                                                    key={resource.id}
                                                                    className='px-3 py-1 bg-gray-50 border border-black/5 rounded-lg text-sm'
                                                                >
                                                                    <span className='text-gray-600'>{resource.name}:</span>
                                                                    <span className='ml-1 font-medium'>
                                                                        {resource.amount} {resource.unit}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
