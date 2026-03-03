'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Circle, LayoutDashboard, Users, ClipboardList, Map, TrendingUp, AlertTriangle, CheckCircle2, BriefcaseBusiness, Database, ShieldCheck, Calculator, Landmark, BookOpen, Settings2, Sprout, BarChart3, Loader2 } from 'lucide-react';
import { UserRole } from '@/lib/config/role-config';
import { getVisibleNavigation, NavItem, CONSULTING_NAVIGATION } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';

const ICON_MAP: Record<string, any> = {
    'crop_dashboard': LayoutDashboard,
    'crm': Users,
    'plans': ClipboardList,
    'techmaps': Map,
    'execution': TrendingUp,
    'deviations': AlertTriangle,
    'results': CheckCircle2,
    'commerce': BriefcaseBusiness,
    'exploration': Database,
    'strategy': ShieldCheck,
    'economy': Calculator,
    'finance': Landmark,
    'gr': ShieldCheck,
    'production': Package, // Sidebar use Package, let's fix if needed
    'knowledge': BookOpen,
    'settings': Settings2,
    'exec_agro': Sprout,
    'exec_manager': BarChart3
};

// Re-defining groups based on spec
const NAV_GROUPS = [
    { id: 'crop', label: 'Урожай', domainIds: ['crop_dashboard'] },
    { id: 'crm', label: 'CRM', domainIds: ['crm'] }, // Note: in navigation-policy, crm is subItem of crop_dashboard. We need to handle this.
    { id: 'finance', label: 'Финансы', domainIds: ['economy', 'finance'] },
    { id: 'commerce', label: 'Коммерция', domainIds: ['commerce'] },
    { id: 'settings', label: 'Настройки', domainIds: ['settings', 'gr', 'knowledge', 'exploration'] },
];

interface TopNavProps {
    role: string;
}

export function TopNav({ role }: TopNavProps) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [activeGroup, setActiveGroup] = useState<string | null>(null);

    useEffect(() => {
        const items = getVisibleNavigation(role as UserRole);
        setNavItems(items);
    }, [role]);

    // Recursive search for active item and its group
    const findActiveGroup = (items: NavItem[]): string | null => {
        for (const item of items) {
            if (pathname.startsWith(item.path)) {
                // Find which group this item belongs to
                for (const group of NAV_GROUPS) {
                    if (group.domainIds.includes(item.id) || group.id === item.domain) return group.id;
                }
            }
            if (item.subItems) {
                const subGroup = findActiveGroup(item.subItems);
                if (subGroup) return subGroup;
            }
        }
        return null;
    };

    const currentGroup = findActiveGroup(navItems);

    const renderDropdown = (items: NavItem[]) => {
        return (
            <div className="absolute top-full left-0 mt-1 min-w-[220px] bg-white border border-black/10 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {items.map(item => (
                    <div key={item.id} className="px-2">
                        <Link
                            href={item.path}
                            className={clsx(
                                "flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm font-normal",
                                pathname === item.path ? "bg-slate-50 text-slate-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                item.disabled && "opacity-40 pointer-events-none"
                            )}
                        >
                            {(() => {
                                const Icon = ICON_MAP[item.id] || Circle;
                                return <Icon size={16} strokeWidth={1.5} className={pathname === item.path ? "text-slate-900" : "text-gray-400"} />;
                            })()}
                            <span>{item.label}</span>
                        </Link>
                        {item.subItems && (
                            <div className="ml-4 mt-1 border-l border-gray-100 pl-2 space-y-1">
                                {item.subItems.map(sub => (
                                    <Link
                                        key={sub.id}
                                        href={sub.path}
                                        className={clsx(
                                            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors",
                                            pathname === sub.path ? "text-slate-900 font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50/50"
                                        )}
                                    >
                                        <Circle size={4} className={pathname === sub.path ? "fill-slate-900" : "fill-gray-300"} />
                                        {sub.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <header className="h-16 w-full bg-white border-b border-black/10 flex items-center px-6 sticky top-0 z-40 font-geist">
            {/* Logo */}
            <div className="mr-8 shrink-0">
                <Link href="/consulting/dashboard">
                    <img
                        src="/branding/rai-agroplatforma-transparent.png"
                        alt="RAI Agroplatform"
                        className="h-10 w-auto object-contain"
                    />
                </Link>
            </div>

            {/* Navigation Groups */}
            <nav className="flex items-center gap-1 h-full">
                {NAV_GROUPS.map(group => {
                    // Filter nav items that belong to this group
                    const groupItems = navItems.filter(item =>
                        group.domainIds.includes(item.id) || group.id === item.domain
                    );

                    if (groupItems.length === 0) return null;

                    const isActive = currentGroup === group.id;

                    return (
                        <div
                            key={group.id}
                            className="relative h-full flex items-center group"
                            onMouseEnter={() => setActiveGroup(group.id)}
                            onMouseLeave={() => setActiveGroup(null)}
                        >
                            <button
                                className={clsx(
                                    "flex items-center gap-2 px-4 h-10 rounded-xl transition-all duration-300 text-sm tracking-wide uppercase font-medium",
                                    isActive
                                        ? "bg-slate-50 text-slate-900"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                )}
                            >
                                {group.label}
                                <ChevronDown size={14} className={clsx("transition-transform duration-200", activeGroup === group.id && "rotate-180")} />
                            </button>

                            {/* Dropdown container */}
                            {activeGroup === group.id && renderDropdown(groupItems)}
                        </div>
                    );
                })}
            </nav>

            {/* Right side (Role indicator / System Status) */}
            <div className="ml-auto flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{role}</span>
                </div>
            </div>
        </header>
    );
}

// Sidebar dependencies for Icons
import { Package } from 'lucide-react';
