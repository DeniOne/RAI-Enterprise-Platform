'use client';

import React from 'react';
import { AppShell } from './AppShell';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
}

/**
 * @layout AuthenticatedLayout
 * @description Локальная shell-обертка для маршрутов вне route-groups.
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
    return (
        <AppShell>{children}</AppShell>
    );
}
