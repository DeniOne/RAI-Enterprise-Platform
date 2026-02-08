import React from 'react';
import { cookies } from 'next/headers';
// В реальном проекте используем свой API-клиент
import LegalContextView from './LegalContextView';

async function getLegalRequirements(token: string) {
    // Пока мокаем для демонстрации CTX-LGL-01
    return [
        {
            id: 'LR-124',
            summary: 'Валидация протоколов научных исследований',
            target: 'RND_PROTOCOL',
            status: 'ATTENTION' as any,
            version: '2025.3',
            obligations: []
        },
        {
            id: 'LR-089',
            summary: 'Лимиты внесения минеральных удобрений',
            target: 'OPERATIONAL_TASK',
            status: 'OK' as any,
            version: '2025.1',
            obligations: []
        },
        {
            id: 'LR-211',
            summary: 'Защита персональных данных сотрудников',
            target: 'EMPLOYEE_PROFILE',
            status: 'OK' as any,
            version: '2024.12',
            obligations: []
        }
    ];
}

export default async function LegalPage() {
    const token = cookies().get('auth_token')?.value || '';
    const requirements = await getLegalRequirements(token);

    return (
        <LegalContextView requirements={requirements} />
    );
}
