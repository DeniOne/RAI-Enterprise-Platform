'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/config/role-config'; // Assuming this is where UserRole is defined in the project
import { getVisibleNavigation, NavItem } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Circle, LayoutDashboard, Users, ClipboardList, Map, Calculator, AlertTriangle, CheckCircle2, TrendingUp, ShieldCheck, Database, Settings2, BookOpen, Package, Landmark, Sprout, BarChart3, Loader2, BriefcaseBusiness } from 'lucide-react';

// Domain Layer Mapping (Immutable definition for View Layer)
const DOMAIN_LAYERS: Record<string, number> = {
    'crop': 1,      // CORE
    'commerce': 1,
    'exploration': 2,
    'strategy': 2,  // STRATEGIC
    'economy': 2,
    'finance': 2,
    'gr': 2,
    'production': 3, // PHYSICAL
    'knowledge': 4,  // CROSS-LAYER
    'settings': 5    // SYSTEM
};

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
    'production': Package,
    'knowledge': BookOpen,
    'settings': Settings2,
    'exec_agro': Sprout,
    'exec_manager': BarChart3
};

interface SidebarProps {
    role: string;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

    // "Crop Management" (domain='crop') is consistently expanded/dominant
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['crop_dashboard']));

    // Helper to check if domain is active (robust startswith)
    const isDomainActive = (item: NavItem, currentPath: string) => {
        if (!item.subItems) return false;
        // Normalize paths to avoid trailing slash issues
        const normalize = (p: string) => p.endsWith('/') ? p.slice(0, -1) : p;
        const target = normalize(item.path);
        const current = normalize(currentPath);

        return current.startsWith(target);
    };

    useEffect(() => {
        const items = getVisibleNavigation(role as UserRole);
        setNavItems(items);

        const newExpanded = new Set<string>();

        // 1. Always expand Core domain
        const cropItem = items.find(i => i.domain === 'crop');
        if (cropItem) {
            newExpanded.add(cropItem.id);
        }

        // 2. Expand parents of active item
        const findAndExpand = (items: NavItem[]) => {
            for (const item of items) {
                if (pathname.startsWith(item.path)) {
                    newExpanded.add(item.id);
                }
                if (item.subItems) {
                    if (hasActiveChild(item, pathname)) {
                        newExpanded.add(item.id);
                    }
                    findAndExpand(item.subItems);
                }
            }
        };
        findAndExpand(items);

        setExpandedIds(prev => {
            const next = new Set(prev);
            newExpanded.forEach(id => next.add(id));
            return next;
        });

    }, [role, pathname]);

    useEffect(() => {
        if (navigatingTo && pathname === navigatingTo) {
            setNavigatingTo(null);
        }
    }, [navigatingTo, pathname]);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const hasActiveChild = (item: NavItem, path: string): boolean => {
        if (item.path !== item.subItems?.[0]?.path && path === item.path) return true; // Direct match
        return item.subItems?.some(sub => path.startsWith(sub.path) || hasActiveChild(sub, path)) ?? false;
    };

    const isActive = (item: NavItem) => {
        // If it's a sub-item, we want closer match (including hash if it exists)
        if (!item.subItems) {
            // Check if current path + hash matches exactly
            const currentFullPath = typeof window !== 'undefined' ? (window.location.pathname + window.location.hash) : pathname;
            return currentFullPath === item.path || pathname === item.path;
        }
        return pathname.startsWith(item.path);
    };

    const renderNavItem = (item: NavItem, depth: number = 0, index: number = 0, siblings: NavItem[] = []) => {
        const isExpanded = expandedIds.has(item.id);
        const active = isActive(item);
        const isLeaf = !item.subItems;

        // Domain Logic
        const domainLayer = DOMAIN_LAYERS[item.domain] || 99;
        const prevItem = index > 0 ? siblings[index - 1] : null;
        const prevLayer = prevItem ? (DOMAIN_LAYERS[prevItem.domain] || 99) : domainLayer;
        const isLayerBoundary = depth === 0 && domainLayer !== prevLayer;

        // Semantic states
        const isCoreRoot = item.domain === 'crop' && depth === 0;
        const isCropInner = item.domain === 'crop' && depth > 0;
        const isSystem = item.domain === 'settings';
        const domainActive = depth === 0 && isDomainActive(item, pathname);

        // Micro-grouping (Visual phases)
        const isMicroGroupStart = ['execution', 'results'].includes(item.id);
        const isOverview = item.id === 'overview';

        return (
            <div key={item.id} className="w-full">
                {/* Layer Separator (Visual only) */}
                {isLayerBoundary && (
                    <div className={clsx(
                        "w-full my-3",
                        isSystem ? "border-t border-gray-100/50 pt-3 mt-6" : "h-px"
                    )} />
                )}

                <div
                    className={clsx(
                        "flex items-center px-3 rounded-xl transition-all duration-300 select-none group relative overflow-hidden",
                        isLeaf && depth > 0 ? "w-fit max-w-full" : "w-full",
                        item.disabled && "opacity-40 pointer-events-none grayscale",

                        // --- Primary Domain Zone (Crop Root) ---
                        isCoreRoot && "py-3 bg-slate-50/80 border-l-[3px] border-slate-400 mb-3",

                        // --- Normal items ---
                        !isCoreRoot && "py-2 mb-1",

                        // --- Active Item State (Canonical Institutional Style) ---
                        active && !item.subItems
                            ? "bg-slate-50 text-slate-900"
                            : isSystem
                                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-50/50"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80",

                        depth > 0 && "ml-4"
                    )}
                >
                    {/* Icon Rendering */}
                    {depth === 0 && (
                        <div className={clsx(
                            "mr-3 transition-transform duration-300 group-hover:scale-110",
                            active ? "text-slate-900" : "text-gray-400 group-hover:text-black"
                        )}>
                            {(() => {
                                const Icon = ICON_MAP[item.id] || Circle;
                                return <Icon size={18} strokeWidth={1.5} />;
                            })()}
                        </div>
                    )}

                    {/* Label Area (Always navigates) */}
                    <div className={clsx(isLeaf ? "flex items-center" : "flex-1 flex items-center")}>
                        <Link
                            href={item.path}
                            data-testid={`nav-link-${item.id}`}
                            onClick={() => {
                                if (item.path !== pathname) {
                                    setNavigatingTo(item.path);
                                }
                            }}
                            className={clsx(isLeaf ? "inline-flex items-center py-0.5" : "flex-1 flex items-center py-0.5")}
                        >
                            {depth > 0 && !item.subItems && (
                                <Circle size={4} className={clsx("mr-2.5", active ? "fill-slate-900" : "fill-gray-300 group-hover:fill-gray-400")} />
                            )}
                            <span className={clsx(
                                "font-medium transition-colors leading-snug",
                                depth === 0 ? "text-[13px] uppercase tracking-wider" : "text-sm",
                                isCoreRoot ? "text-slate-900" : (active || domainActive ? "text-slate-900" : "text-gray-500 group-hover:text-gray-900")
                            )}>
                                {item.label}
                            </span>
                        </Link>

                        {/* Expand/Collapse Toggle (Separate from label) */}
                        {item.subItems && (
                            <button
                                onClick={(e) => toggleExpand(item.id, e)}
                                className="p-1 px-2 hover:bg-black/5 rounded-md transition-colors ml-auto"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                                {isExpanded
                                    ? <ChevronDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                                    : <ChevronRight size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                                }
                            </button>
                        )}
                    </div>
                </div>

                {/* SubItems */}
                {
                    item.subItems && isExpanded && (
                        <div className={clsx(
                            "flex flex-col border-l border-gray-100 mixed-blend-multiply",
                            // Dynamic left margin based on whether it's inside Core or not
                            isCoreRoot ? "ml-5 pl-2 border-slate-100 space-y-1 mt-1" : "ml-5 pl-2 space-y-0.5 mt-0.5"
                        )}>
                            {item.subItems.map((sub, idx, arr) => renderNavItem(sub, depth + 1, idx, arr))}
                        </div>
                    )
                }
            </div >
        );
    };
    return (
        <aside className="w-[350px] h-screen bg-white border-r border-black/10 flex flex-col sticky left-0 top-0 font-geist">
            {/* Header */}
            <div className="p-6 pb-4 sticky top-0 z-10 bg-white border-b border-black/5">
                <img
                    src="/branding/rai-agroplatforma-transparent.png"
                    alt="RAI Agroplatform"
                    className="h-16 w-auto object-contain"
                />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-6 space-y-1 overflow-y-auto">
                {navItems.map((item, index, arr) => renderNavItem(item, 0, index, arr))}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-black/5 bg-gray-50/50">
                {navigatingTo ? (
                    <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-wider">
                        <Loader2 size={12} className="animate-spin" />
                        Loading...
                    </div>
                ) : null}
                <div className="mb-2 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium">
                    {role} SPACE
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Canonical
                </div>
            </div>
        </aside>
    );
}
