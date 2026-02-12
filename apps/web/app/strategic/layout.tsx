import React from 'react';
import { redirect } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { getUserData } from '@/lib/api/auth-server';

export default async function StrategicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUserData()

    if (!user) {
        redirect('/login')
    }

    return (
        <AuthenticatedLayout role={user.role}>
            <div className="space-y-8">
                <header className="flex justify-between items-end border-b border-black/5 pb-6">
                    <div>
                        <h2 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                            Проекция // Стратегический контекст
                        </h2>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-300 font-medium">
                        Целостность системы: Подтверждена
                    </div>
                </header>
                {children}
            </div>
        </AuthenticatedLayout>
    );
}
