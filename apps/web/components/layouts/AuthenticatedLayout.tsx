'use client';

import React from 'react';
import { Sidebar } from '@/components/navigation/Sidebar';

interface AuthenticatedLayoutProps {
    children: React.ReactNode;
    role: string;
}

export function AuthenticatedLayout({ children, role }: AuthenticatedLayoutProps) {
    return (
        <div className="flex bg-[#FAFAFA] min-h-screen text-[#171717]">
            <Sidebar role={role} />
            <main className="flex-1 ml-[350px] min-h-screen px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
