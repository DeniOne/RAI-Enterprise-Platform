import { redirect } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layouts/AuthenticatedLayout';
import { getUserData } from '@/lib/api/auth-server';

export default async function FrontOfficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getUserData()

    if (!user) {
        redirect('/login')
    }

    return (
        <AuthenticatedLayout role={user.role}>
            {children}
        </AuthenticatedLayout>
    );
}
