import { redirect } from 'next/navigation';
import { getUserData, isExternalFrontOfficeUser } from '@/lib/api/auth-server';
import Link from 'next/link';
import { EXTERNAL_FRONT_OFFICE_BASE_PATH } from '@/lib/front-office-routes';

const NAV_ITEMS = [
    { href: '/front-office', label: 'Операционный центр' },
    { href: '/front-office/fields', label: 'Поля' },
    { href: '/front-office/seasons', label: 'Сезоны' },
    { href: '/front-office/tech-maps', label: 'Техкарты' },
    { href: '/front-office/tasks', label: 'Задачи' },
    { href: '/front-office/deviations', label: 'Отклонения' },
    { href: '/front-office/context', label: 'Контекст' },
];

export default async function FrontOfficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getUserData()

    if (!user) {
        redirect('/login')
    }

    if (isExternalFrontOfficeUser(user)) {
        redirect(EXTERNAL_FRONT_OFFICE_BASE_PATH);
    }

    return (
        <div className="space-y-8">
            <div className="rounded-[28px] border border-black/10 bg-white px-6 py-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gray-400">Front-Office</p>
                        <h1 className="mt-2 text-2xl font-medium text-gray-900">
                            Контур хозяйства
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Telegram-first исполнение, evidence и навигация по полям, сезонам, техкартам и задачам.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="rounded-full border border-black/10 px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-black/20 hover:text-gray-900"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
