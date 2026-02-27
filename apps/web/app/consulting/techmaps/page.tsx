'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type TechMap = {
    id: string;
    status: string;
    version?: number;
    crop?: string;
    harvestPlanId?: string;
    seasonId?: string;
    updatedAt?: string;
};

function nextStatuses(current: string): string[] {
    if (current === 'DRAFT' || current === 'GENERATED_DRAFT') return ['REVIEW'];
    if (current === 'REVIEW') return ['APPROVED'];
    if (current === 'APPROVED') return ['ACTIVE'];
    if (current === 'ACTIVE') return ['ARCHIVED'];
    return [];
}

export default function TechMapsPage() {
    const [maps, setMaps] = useState<TechMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchMaps = async () => {
        setLoading(true);
        try {
            const response = await api.consulting.techmaps.list();
            setMaps(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to load techmaps:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaps();
    }, []);

    const counters = useMemo(() => {
        const byStatus: Record<string, number> = {};
        maps.forEach((m) => {
            byStatus[m.status] = (byStatus[m.status] || 0) + 1;
        });
        return byStatus;
    }, [maps]);

    const handleTransition = async (id: string, status: string) => {
        setBusyId(id);
        try {
            await api.consulting.techmaps.transition(id, status);
            await fetchMaps();
        } catch (error: any) {
            console.error('Failed to transition techmap:', error);
            alert(error?.response?.data?.message || 'Ошибка перехода техкарты');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className='space-y-6'>
            <div>
                <h1 className='text-xl font-medium text-gray-900 tracking-tight mb-1'>Технологические карты</h1>
                <p className='text-sm font-normal text-gray-500'>Рабочий реестр техкарт с реальными статусными переходами.</p>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
                {['GENERATED_DRAFT', 'DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE'].map((status) => (
                    <Card key={status}>
                        <p className='text-xs text-gray-500 mb-1'>{status}</p>
                        <p className='text-2xl font-semibold'>{counters[status] || 0}</p>
                    </Card>
                ))}
            </div>

            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : maps.length === 0 ? (
                    <p className='text-sm text-gray-500'>Техкарты отсутствуют.</p>
                ) : (
                    <div className='space-y-4'>
                        {maps.map((map) => (
                            <div key={map.id} className='border border-black/10 rounded-2xl p-4'>
                                <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
                                    <div>
                                        <p className='font-semibold text-gray-900'>
                                            {map.crop || 'Культура не указана'} • v{map.version ?? '-'}
                                        </p>
                                        <p className='text-xs text-gray-500'>
                                            {map.id} • {map.status} • {map.updatedAt ? new Date(map.updatedAt).toLocaleDateString('ru-RU') : '-'}
                                        </p>
                                    </div>
                                    <div className='flex gap-2 flex-wrap'>
                                        {nextStatuses(map.status).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleTransition(map.id, status)}
                                                disabled={busyId === map.id}
                                                className='px-4 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-zinc-800 disabled:opacity-50'
                                            >
                                                {busyId === map.id ? '...' : `-> ${status}`}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
