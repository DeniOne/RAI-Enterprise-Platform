'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type FieldItem = {
    id: string;
    name?: string;
    areaHa?: number;
    status?: string;
};

export default function Page() {
    const [fields, setFields] = useState<FieldItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await api.crm.fields();
                setFields(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Failed to load fields:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Поля / Объекты</h1>
            <Card>
                <p className='text-sm text-gray-700'>Реестр полей с базовыми параметрами.</p>
            </Card>
            <Card>
                {loading ? (
                    <p className='text-sm text-gray-500'>Загрузка...</p>
                ) : fields.length === 0 ? (
                    <p className='text-sm text-gray-500'>Поля пока не добавлены.</p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-gray-500 border-b'>
                                    <th className='py-2 pr-4'>Название</th>
                                    <th className='py-2 pr-4'>Площадь (га)</th>
                                    <th className='py-2'>Статус</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fields.map((field) => (
                                    <tr key={field.id} className='border-b last:border-b-0'>
                                        <td className='py-2 pr-4 text-gray-900'>{field.name || 'Без названия'}</td>
                                        <td className='py-2 pr-4'>{field.areaHa ?? '-'}</td>
                                        <td className='py-2'>{field.status || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
