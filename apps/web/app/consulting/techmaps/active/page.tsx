'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';

type TechMapItem = {
    id: string;
    status?: string;
    version?: number;
    crop?: string;
    updatedAt?: string;
};

type RowItem = {
    code: string;
    item: TechMapItem;
};

function MapTable({ rows, isFocused }: { rows: RowItem[]; isFocused: (row: RowItem) => boolean }) {
    if (rows.length === 0) {
        return <p className='text-sm text-gray-500'>Нет записей.</p>;
    }

    return (
        <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
                <thead>
                    <tr className='text-left text-gray-500 border-b'>
                        <th className='py-2 pr-4'>Код</th>
                        <th className='py-2 pr-4'>Версия</th>
                        <th className='py-2 pr-4'>Культура</th>
                        <th className='py-2 pr-4'>Статус</th>
                        <th className='py-2'>Обновлено</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const focused = isFocused(row);
                        return (
                            <tr key={row.item.id} data-focus={focused ? 'true' : 'false'} className={clsx('border-b last:border-b-0', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                <td className='py-2 pr-4 font-medium text-gray-900'>{row.code}</td>
                                <td className='py-2 pr-4'>{row.item.version ?? '-'}</td>
                                <td className='py-2 pr-4'>{row.item.crop || '-'}</td>
                                <td className='py-2 pr-4'>{row.item.status || 'UNKNOWN'}</td>
                                <td className='py-2'>{row.item.updatedAt ? new Date(row.item.updatedAt).toLocaleDateString('ru-RU') : '-'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
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
                console.error('Failed to load active techmaps:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const activeRows = useMemo<RowItem[]>(() => {
        const activeMaps = maps.filter((m) => String(m.status) === 'ACTIVE');
        return activeMaps.map((item, index) => ({
            code: `TM-${String(index + 1).padStart(3, '0')}`,
            item,
        }));
    }, [maps]);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: activeRows,
        matchItem: (row, context) => includesFocus([row.code, row.item.id, row.item.crop, row.item.status], context.focusEntity),
        watch: [activeRows.length],
    });

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Техкарты — Активные</h1>
            <Card>
                <p className='text-sm text-gray-700'>Техкарты, допущенные к исполнению.</p>
            </Card>

            {hasFocus && (
                <Card className={hasFocusedEntity ? 'border-sky-200 bg-sky-50' : 'border-amber-200 bg-amber-50'}>
                    <p className={clsx('text-sm', hasFocusedEntity ? 'text-sky-700' : 'text-amber-700')}>
                        {hasFocusedEntity
                            ? `Найдена сущность: ${focusEntity}. Строка подсвечена.`
                            : `Сущность ${focusEntity} не найдена среди активных техкарт.`}
                    </p>
                </Card>
            )}

            <Card>{loading ? <p className='text-sm text-gray-500'>Загрузка...</p> : <MapTable rows={activeRows} isFocused={isFocused} />}</Card>
        </div>
    );
}
