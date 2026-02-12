'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '@/lib/config/role-config'; // Assuming this is where UserRole is defined in the project
import { getVisibleNavigation, NavItem } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Circle } from 'lucide-react';

// Domain Layer Mapping (Immutable definition for View Layer)
const DOMAIN_LAYERS: Record<string, number> = {
    'crop': 1,      // CORE
    'strategy': 2,  // STRATEGIC
    'economy': 2,
    'finance': 2,
    'gr': 2,
    'production': 3, // PHYSICAL
    'knowledge': 4,  // CROSS-LAYER
    'settings': 5    // SYSTEM
};

interface SidebarProps {
    role: string;
}

export function Sidebar({ role }: SidebarProps) {
    const pathname = usePathname();
    const [navItems, setNavItems] = useState<NavItem[]>([]);

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
        if (item.subItems) {
            return pathname.startsWith(item.path);
        }
        return pathname === item.path;
    };

    const renderNavItem = (item: NavItem, depth: number = 0, index: number = 0, siblings: NavItem[] = []) => {
        const isExpanded = expandedIds.has(item.id);
        const active = isActive(item);

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
                        "flex items-center px-3 rounded-lg transition-colors duration-200 select-none group",
                        item.disabled && "opacity-40 pointer-events-none grayscale",

                        // --- Primary Domain Zone (Crop Root) ---
                        isCoreRoot && "py-3 bg-slate-50/80 border-l-[3px] border-slate-400 mb-3",

                        // --- Crop Inner Items (Rhythm Fix) ---
                        // Reduced from py-2.5 to py-2 for better density
                        isCropInner && "py-2",

                        // --- Micro-Grouping ---
                        // Reduced from mt-3 to mt-2 (30% less)
                        isMicroGroupStart && "mt-2",

                        // --- Standard Items ---
                        // Reduced from py-2 to py-1.5
                        !isCoreRoot && !isCropInner && "py-1.5 mb-0.5",

                        // --- Active Domain Indicator ---
                        !isCoreRoot && domainActive && "bg-stone-50/80",

                        // --- System Layer De-emphasis ---
                        isSystem && "mt-1",

                        // --- Active Item State ---
                        active && !item.subItems
                            ? "bg-black text-white shadow-sm"
                            : isSystem
                                ? "text-gray-400 hover:text-gray-700 hover:bg-gray-50/50" // Dimmed system items
                                : isOverview
                                    ? "text-gray-500 hover:text-gray-900 hover:bg-gray-50" // Overview weakened
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",

                        // Depth Indentation
                        depth > 0 && "ml-4"
                    )}
                >
                    {/* Link or Button depending on if it has children */}
                    {item.subItems ? (
                        <div
                            className="flex-1 flex items-center justify-between cursor-pointer w-full"
                            onClick={(e) => toggleExpand(item.id, e)}
                        >
                            <span className={clsx(
                                "font-medium transition-colors leading-snug",
                                // Headers styling
                                depth === 0
                                    ? (isCoreRoot ? "text-xs uppercase tracking-wider font-medium" : "text-xs uppercase tracking-wide font-medium")
                                    : "text-sm",
                                isCoreRoot ? "text-slate-900" : (domainActive ? "text-gray-900" : "text-gray-500 group-hover:text-gray-900"),
                                titleSize(depth),
                            )}>
                                {item.label}
                            </span>
                            {/* Chevron matches text color */}
                            {isExpanded
                                ? <ChevronDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                                : <ChevronRight size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                            }
                        </div>
                    ) : (
                        <Link href={item.path} className="flex-1 flex items-center">
                            <span className={clsx(
                                "font-medium text-sm transition-colors leading-snug", // Changed to leading-snug
                                active ? "text-white" : (isSystem ? "text-gray-400 group-hover:text-gray-700" : "")
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )}
                </div>

                {/* SubItems */}
                {item.subItems && isExpanded && (
                    <div className={clsx(
                        "flex flex-col border-l border-gray-100 mixed-blend-multiply",
                        // Dynamic left margin based on whether it's inside Core or not
                        isCoreRoot ? "ml-5 pl-2 border-slate-100 space-y-1 mt-1" : "ml-5 pl-2 space-y-0.5 mt-0.5"
                    )}>
                        {item.subItems.map((sub, idx, arr) => renderNavItem(sub, depth + 1, idx, arr))}
                    </div>
                )}
            </div>
        );
    };

    // Helper for font sizes to avoid subtle layout shifts or inconsistencies
    const titleSize = (depth: number) => {
        if (depth === 0) return "text-xs";
        return "text-sm";
    }

    return (
        <aside className="w-[350px] h-screen bg-white border-r border-black/10 flex flex-col fixed left-0 top-0 overflow-y-auto font-geist">
            {/* Header */}
            <div className="p-6 pb-4">
                <div className="text-gray-900 font-medium tracking-tight text-lg leading-none">
                    RAI ENTERPRISE
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-medium">
                    {role} SPACE
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-6 space-y-1">
                {navItems.map((item, index, arr) => renderNavItem(item, 0, index, arr))}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-black/5 bg-gray-50/50">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    System Canonical
                </div>
            </div>
        </aside>
    );
}
