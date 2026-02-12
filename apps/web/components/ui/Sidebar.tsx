'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getVisibleModules } from '@/lib/config/role-config';
import clsx from 'clsx';

interface SidebarProps {
    role: string;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const modules = getVisibleModules(role);

    return (
        <aside className="w-64 h-screen bg-white border-r border-black/10 flex flex-col fixed left-0 top-0">
            <div className="p-6">
                <div className="text-gray-900 font-medium tracking-tight text-lg">
                    RAI ENTERPRISE
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1 font-medium">
                    SYSTEM CORE // {role}
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                <Link
                    href="/dashboard"
                    className={clsx(
                        "flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200 font-medium",
                        pathname === '/dashboard'
                            ? "bg-black text-white shadow-lg shadow-black/5"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    )}
                >
                    Dashboard
                </Link>

                <div className="pt-8 pb-2 px-4">
                    <div className="text-[10px] text-gray-300 uppercase tracking-[0.2em] font-medium">Modules</div>
                </div>

                {modules.map((mod) => (
                    <Link
                        key={mod.id}
                        href={mod.path}
                        className={clsx(
                            "flex items-center px-4 py-3 rounded-xl text-sm transition-all duration-200 font-medium",
                            pathname.startsWith(mod.path)
                                ? "bg-black text-white shadow-lg shadow-black/5"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                        )}
                    >
                        {mod.label}
                    </Link>
                ))}
            </nav>

            <div className="p-6 border-t border-black/5">
                <div className="text-[10px] text-gray-400 text-center uppercase tracking-[0.2em] font-medium opacity-50">
                    Phase Beta Closure
                </div>
            </div>
        </aside>
    );
}
