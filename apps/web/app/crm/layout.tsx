import { redirect } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { getUserData } from '@/lib/api/auth-server';
import { ReactNode } from "react";

export default async function CrmLayout({ children }: { children: ReactNode }) {
    const user = await getUserData();

    if (!user) {
        redirect('/login');
    }

    return (
        <AuthenticatedLayout>
            <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <h1 className="text-xl font-medium text-gray-900">CRM: Client Management</h1>
                </header>
                {children}
            </div>
        </AuthenticatedLayout>
    );
}
