'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
    { href: '/exploration', label: 'Витрина' },
    { href: '/exploration/strategic', label: 'Стратегические (SEU)' },
    { href: '/exploration/constraints', label: 'Ограничения (CDU)' },
];

export default function ExplorationLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-black/10 bg-white p-3">
                <nav className="flex flex-wrap gap-2">
                    {TABS.map((tab) => {
                        const active = pathname === tab.href;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={clsx(
                                    'rounded-xl px-3 py-2 text-sm font-medium transition',
                                    active ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                                )}
                            >
                                {tab.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            {children}
        </div>
    );
}
