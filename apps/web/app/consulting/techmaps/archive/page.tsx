'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type TechMapItem = {
    id: string;
    status?: string;
    version?: number;
    crop?: string;
    updatedAt?: string;
};

export default function Page() {
    const [maps, setMaps] = useState<TechMapItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.consulting.techmaps.list();
                setMaps(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Failed to load archived techmaps:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const archivedMaps = useMemo(() => maps.filter((m) => String(m.status) === 'ARCHIVED'), [maps]);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Техкарты — Архив</h1>
            <Card>
                <p className='text-sm text-gray-700'>Архив завершённых версий техкарт.</p>
            </Card>
            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : archivedMaps.length === 0 ? (
                    <p className='text-sm text-gray-500'>Архивных карт нет.</p>
                ) : (
                    <ul className='space-y-2 text-sm'>
                        {archivedMaps.map((item) => (
                            <li key={item.id} className='border-b last:border-b-0 py-2'>
                                Версия {item.version ?? '-'} • {item.crop || '-'} • {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ru-RU') : '-'}
                            </li>
                        ))}
                    </ul>
                )}
            </Card>
        </div>
    );
}
