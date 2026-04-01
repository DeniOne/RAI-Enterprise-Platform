import React from 'react';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/layouts/AppShell';
import { getUserData, isExternalFrontOfficeUser } from '@/lib/api/auth-server';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUserData();

    if (!user) {
        redirect('/login');
    }

    return (
        <AppShell
            role={user.role}
            isExternalFrontOffice={isExternalFrontOfficeUser(user)}
        >
            {children}
        </AppShell>
    );
}
