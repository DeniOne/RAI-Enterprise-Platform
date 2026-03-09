'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
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
    Monitor,
    ShieldAlert,
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
    production: Package,
    knowledge: BookOpen,
    trust: ShieldCheck,
    control_tower: Monitor,
    governance_security: ShieldAlert,
    settings: Settings2,
    ct_dashboard: Monitor,
    ct_agents: Users,
    sec_dashboard: ShieldCheck,
    sec_monitoring: ShieldAlert,
};

interface TopNavProps {
    role: string;
}

const SHORT_LABEL_MAP: Record<string, string> = {
    crop_dashboard: 'Урожай',
    commerce: 'Коммерция',
    exploration: 'Исследования',
    strategy: 'Стратегия',
    economy: 'Экономика',
    finance: 'Финансы',
    gr: 'GR',
    production: 'Производство',
    knowledge: 'Знания',
    settings: 'Настройки',
    control_tower: 'Пульт',
    governance_security: 'Безопасность',
};

function getItemIcon(item: NavItem): LucideIcon {
    return ICON_MAP[item.id] ?? ICON_MAP[item.domain] ?? Circle;
}

function getShortLabel(item: NavItem): string {
    return SHORT_LABEL_MAP[item.id] ?? item.label;
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
    const headerRef = useRef<HTMLElement | null>(null);

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

    useEffect(() => {
        setOpenMenuId(null);
    }, [pathname]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) {
                setOpenMenuId(null);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const renderFlyout = (subItems: NavItem[]) => (
        <div className="absolute left-full top-0 ml-3 min-w-[250px] rounded-[24px] border border-black/10 bg-white/95 p-3 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
            <div className="space-y-1">
                {subItems.map((subItem) => (
                    <Link
                        key={subItem.id}
                        href={subItem.path}
                        className={clsx(
                            'block rounded-2xl px-4 py-2.5 text-[13px] font-medium transition-all duration-150',
                            isItemActive(subItem, pathname)
                                ? 'bg-[#F4F6FB] text-[#030213] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]'
                                : 'text-[#717182] hover:bg-[#F7F8FB] hover:text-[#030213]',
                        )}
                    >
                        <span className="break-words">{subItem.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );

    const renderDropdown = (item: NavItem) => {
        const items = item.subItems ?? [];

        return (
            <div
                className="absolute left-0 top-full z-50 mt-3 min-w-[320px] rounded-[26px] border border-black/10 bg-white/95 p-3 shadow-[0_26px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
            >
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
                                        'block rounded-2xl px-4 py-3 text-[13px] font-medium transition-all duration-150',
                                        isSubItemActive
                                            ? 'bg-[#F4F6FB] text-[#030213] shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]'
                                            : 'text-[#717182] hover:bg-[#F7F8FB] hover:text-[#030213]',
                                    )}
                                >
                                    <span className="min-w-0 flex-1 break-words block">{subItem.label}</span>
                                    {hasNestedItems && (
                                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    )}
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
        <header
            ref={headerRef}
            className="sticky top-16 z-40 flex h-16 w-full items-center gap-4 border-b border-black/10 bg-white/95 px-4 backdrop-blur-md sm:px-5 lg:px-6"
        >
            <div className="shrink-0">
                <Link href="/consulting/dashboard">
                    <Image
                        src="/branding/rai-agroplatforma-transparent.png"
                        alt="RAI Agroplatform"
                        width={180}
                        height={40}
                        className="h-8 w-auto object-contain lg:h-10"
                    />
                </Link>
            </div>

            <nav className="flex min-w-0 flex-1 items-center gap-1.5 lg:gap-2">
                {navItems.map((item) => {
                    const isActive = activeRootId === item.id;
                    const isOpen = openMenuId === item.id;
                    const Icon = getItemIcon(item);
                    const shortLabel = getShortLabel(item);
                    const iconWrapClass = clsx(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200',
                        isActive
                            ? 'bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                            : isOpen
                                ? 'bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                                : 'bg-[#F4F6FB] text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]',
                    );

                    return (
                        <div key={item.id} className="relative flex items-center">
                            <button
                                type="button"
                                onClick={() => setOpenMenuId((current) => (current === item.id ? null : item.id))}
                                aria-label={item.label}
                                aria-expanded={isOpen}
                                className={clsx(
                                    'group relative flex h-12 items-center rounded-[20px] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
                                    isActive
                                        ? 'gap-2.5 border-black/10 bg-[linear-gradient(180deg,#F7F8FC_0%,#EFF2F8_100%)] px-3.5 text-[#1f2a44] shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                                        : 'w-12 justify-center border-transparent bg-transparent text-slate-500 hover:border-black/5 hover:bg-[#F7F8FB] hover:text-[#1f2a44]',
                                    isOpen && !isActive && 'border-black/10 bg-[linear-gradient(180deg,#F7F8FC_0%,#EFF2F8_100%)] text-[#1f2a44] shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
                                )}
                            >
                                <span className={iconWrapClass}>
                                    <Icon
                                        size={20}
                                        strokeWidth={1.9}
                                        className={clsx(
                                            'shrink-0',
                                            isActive || isOpen ? 'text-slate-700' : 'text-slate-500',
                                        )}
                                    />
                                </span>

                                {isActive ? (
                                    <>
                                        <span className="whitespace-nowrap pr-0.5 text-[14px] font-medium tracking-[0.01em] text-left">
                                            {shortLabel}
                                        </span>
                                        <ChevronDown
                                            size={14}
                                            className={clsx(
                                                'shrink-0 text-slate-400 transition-transform duration-200',
                                                isOpen && 'rotate-180 text-slate-600',
                                            )}
                                        />
                                    </>
                                ) : null}

                                {!isActive && !isOpen ? (
                                    <span className="pointer-events-none absolute left-1/2 top-full z-40 mt-2 -translate-x-1/2 translate-y-1 rounded-xl border border-black/10 bg-white/95 px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-[#1f2a44] opacity-0 shadow-[0_16px_36px_rgba(15,23,42,0.14)] backdrop-blur-md transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
                                        {item.label}
                                    </span>
                                ) : null}
                            </button>

                            {isOpen ? renderDropdown(item) : null}
                        </div>
                    );
                })}
            </nav>
        </header>
    );
}
