'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    BarChart3,
    BookOpen,
    BriefcaseBusiness,
    Calculator,
    ChevronDown,
    ChevronRight,
    Circle,
    Database,
    Landmark,
    LayoutDashboard,
    LucideIcon,
    Map,
    Package,
    Settings2,
    ShieldCheck,
    Sprout,
    TrendingUp,
    Users,
    ClipboardList,
    AlertTriangle,
    CheckCircle2,
} from 'lucide-react';
import { UserRole } from '@/lib/config/role-config';
import { getVisibleNavigation, NavItem } from '@/lib/consulting/navigation-policy';

const ICON_MAP: Record<string, LucideIcon> = {
    crop_dashboard: LayoutDashboard,
    overview: LayoutDashboard,
    crm: Users,
    farms: Users,
    counterparties: Users,
    fields: Map,
    objects: Map,
    plans: ClipboardList,
    techmaps: Map,
    execution: TrendingUp,
    exec_agro: Sprout,
    exec_manager: BarChart3,
    deviations: AlertTriangle,
    results: CheckCircle2,
    commerce: BriefcaseBusiness,
    strategy: ShieldCheck,
    exploration: Database,
    economy: Calculator,
    finance: Landmark,
    gr: ShieldCheck,
    production: Package,
    knowledge: BookOpen,
    settings: Settings2,
};

interface TopNavProps {
    role: string;
}

function splitLabel(label: string): string[] {
    if (label === 'Управление Урожаем') {
        return ['Управление', 'Урожаем'];
    }

    if (label === 'Производство (Грипил)') {
        return ['Производство', '(Грипил)'];
    }

    return [label];
}

function getItemIcon(item: NavItem): LucideIcon {
    return ICON_MAP[item.id] ?? ICON_MAP[item.domain] ?? Circle;
}

function isItemActive(item: NavItem, pathname: string): boolean {
    if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
        return true;
    }

    return item.subItems?.some((subItem) => isItemActive(subItem, pathname)) ?? false;
}

export function TopNav({ role }: TopNavProps) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [hoveredSubmenuId, setHoveredSubmenuId] = useState<string | null>(null);

    useEffect(() => {
        setNavItems(getVisibleNavigation(role as UserRole));
    }, [role]);

    const activeRootId = useMemo(
        () => navItems.find((item) => isItemActive(item, pathname))?.id ?? null,
        [navItems, pathname],
    );

    useEffect(() => {
        if (!openMenuId) {
            setHoveredSubmenuId(null);
            return;
        }

        const openItem = navItems.find((item) => item.id === openMenuId);
        const firstExpandableSubItem = openItem?.subItems?.find((item) => item.subItems?.length);
        setHoveredSubmenuId(firstExpandableSubItem?.id ?? null);
    }, [navItems, openMenuId]);

    const renderFlyout = (subItems: NavItem[]) => (
        <div className="absolute left-full top-0 ml-2 min-w-[250px] rounded-[22px] border border-black/10 bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
            <div className="space-y-1">
                {subItems.map((subItem) => (
                    <Link
                        key={subItem.id}
                        href={subItem.path}
                        className={clsx(
                            'flex items-start gap-3 rounded-2xl px-3 py-2.5 text-sm leading-5 transition-colors',
                            isItemActive(subItem, pathname)
                                ? 'bg-slate-50 text-slate-900'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                        )}
                    >
                        <Circle
                            size={6}
                            className={clsx(
                                'mt-[7px] shrink-0',
                                isItemActive(subItem, pathname) ? 'fill-slate-900 text-slate-900' : 'fill-slate-300 text-slate-300',
                            )}
                        />
                        <span className="break-words">{subItem.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );

    const renderDropdown = (item: NavItem) => {
        const items = item.subItems ?? [];

        return (
            <div className="absolute left-0 top-full z-50 mt-2 min-w-[300px] rounded-[24px] border border-black/10 bg-white p-3 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
                <div className="space-y-1">
                    {items.map((subItem) => {
                        const hasNestedItems = Boolean(subItem.subItems?.length);
                        const isSubItemActive = isItemActive(subItem, pathname);
                        const isFlyoutOpen = hoveredSubmenuId === subItem.id;

                        return (
                            <div
                                key={subItem.id}
                                className="relative"
                                onMouseEnter={() => setHoveredSubmenuId(hasNestedItems ? subItem.id : null)}
                            >
                                <Link
                                    href={subItem.path}
                                    className={clsx(
                                        'flex items-start gap-3 rounded-2xl px-4 py-2.5 text-sm leading-5 transition-colors',
                                        isSubItemActive
                                            ? 'bg-slate-50 text-slate-900'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                                    )}
                                >
                                    <Circle
                                        size={6}
                                        className={clsx(
                                            'mt-[7px] shrink-0',
                                            isSubItemActive ? 'fill-slate-900 text-slate-900' : 'fill-slate-300 text-slate-300',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1 break-words">{subItem.label}</span>
                                    {hasNestedItems ? (
                                        <ChevronRight size={14} className="mt-1 shrink-0 text-slate-400" />
                                    ) : null}
                                </Link>

                                {hasNestedItems ? (
                                    <div
                                        className={clsx(
                                            'absolute left-8 top-0 h-full w-px bg-black/5',
                                            isFlyoutOpen ? 'opacity-100' : 'opacity-0',
                                        )}
                                    />
                                ) : null}

                                {hasNestedItems && isFlyoutOpen ? renderFlyout(subItem.subItems ?? []) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-black/10 bg-white px-6">
            <div className="mr-8 shrink-0">
                <Link href="/consulting/dashboard">
                    <img
                        src="/branding/rai-agroplatforma-transparent.png"
                        alt="RAI Agroplatform"
                        className="h-10 w-auto object-contain"
                    />
                </Link>
            </div>

            <nav className="flex h-full min-w-0 items-center gap-2.5">
                {navItems.map((item) => {
                    const isActive = activeRootId === item.id;
                    const labelLines = splitLabel(item.label);
                    const isCompactTwoLine = labelLines.length > 1;
                    const Icon = getItemIcon(item);

                    return (
                        <div
                            key={item.id}
                            className="relative flex h-full items-center"
                            onMouseEnter={() => setOpenMenuId(item.id)}
                            onMouseLeave={() => setOpenMenuId(null)}
                        >
                            <button
                                className={clsx(
                                    'flex min-h-10 items-center gap-2.5 rounded-2xl px-4 py-2 text-[15px] transition-all duration-200',
                                    isActive
                                        ? 'bg-slate-50 text-[#1f2a44]'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-[#1f2a44]',
                                )}
                            >
                                <Icon
                                    size={16}
                                    strokeWidth={1.7}
                                    className={clsx(
                                        'shrink-0',
                                        isActive ? 'text-slate-600' : 'text-slate-400',
                                    )}
                                />
                                <span
                                    className={clsx(
                                        'flex font-medium tracking-[0.01em] text-left',
                                        isCompactTwoLine ? 'flex-col items-start leading-[0.96]' : 'items-center whitespace-nowrap',
                                    )}
                                >
                                    {labelLines.map((line, index) => (
                                        <span
                                            key={`${item.id}-${index}`}
                                            className={clsx(
                                                'whitespace-nowrap',
                                                isCompactTwoLine && index === 1 && 'mt-0.5',
                                            )}
                                        >
                                            {line}
                                        </span>
                                    ))}
                                </span>
                                <ChevronDown
                                    size={13}
                                    className={clsx(
                                        'shrink-0 text-slate-400 transition-transform duration-200',
                                        openMenuId === item.id && 'rotate-180 text-slate-600',
                                    )}
                                />
                            </button>

                            {openMenuId === item.id ? renderDropdown(item) : null}
                        </div>
                    );
                })}
            </nav>

            <div className="ml-auto" />
        </header>
    );
}
