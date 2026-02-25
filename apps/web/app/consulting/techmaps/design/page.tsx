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

function TechMapList({ items }: { items: TechMapItem[] }) {
    if (items.length === 0) {
        return <p className='text-sm text-gray-500'>Нет записей.</p>;
    }

    return (
        <ul className='space-y-2 text-sm'>
            {items.map((item) => (
                <li key={item.id} className='border-b last:border-b-0 py-2'>
                    <div className='text-gray-900'>Версия {item.version ?? '-'} • {item.crop || 'Культура не указана'}</div>
                    <div className='text-xs text-gray-500'>
                        {item.status || 'UNKNOWN'} • {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('ru-RU') : '-'}
                    </div>
                </li>
            ))}
        </ul>
    );
}

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
                console.error('Failed to load design techmaps:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const designMaps = useMemo(
        () => maps.filter((m) => ['GENERATED_DRAFT', 'DRAFT', 'REVIEW', 'OVERRIDE_ANALYSIS'].includes(String(m.status))),
        [maps],
    );

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Техкарты — Проектирование</h1>
            <Card>
                <p className='text-sm text-gray-700'>
                    Карты, которые проходят подготовку и этап допуска к исполнению.
                </p>
            </Card>
            <Card>{loading ? <p className='text-sm text-gray-500'>Загрузка...</p> : <TechMapList items={designMaps} />}</Card>
        </div>
    );
}
