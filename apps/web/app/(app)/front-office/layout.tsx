import { redirect } from 'next/navigation';
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

    return children;
}
