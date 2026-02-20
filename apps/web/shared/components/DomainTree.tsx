'use client';

import React from 'react';
import { useAuthority } from '@/core/governance/AuthorityContext';
import {
    LayoutDashboard,
    BarChart3,
    FileText,
    Users2,
    Settings,
    ShieldCheck,
    Zap,
    Package,
    Wallet
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    requiredCapability?: 'canOverride' | 'canSign' | 'canEscalate' | 'canEdit' | 'canApprove';
    group: 'core' | 'domains' | 'system';
}

const NAVIGATION_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Управление Контролем', icon: LayoutDashboard, group: 'core' },
    { id: 'strategy', label: 'Стратегия (BETA)', icon: Zap, group: 'domains', requiredCapability: 'canOverride' },
    { id: 'consulting', label: 'Консалтинг', icon: FileText, group: 'domains' },
    { id: 'production', label: 'Производство', icon: Package, group: 'domains' },
    { id: 'finance', label: 'Финансы (Audit)', icon: Wallet, group: 'domains', requiredCapability: 'canApprove' },
    { id: 'crm', label: 'Клиенты', icon: Users2, group: 'domains' },
    { id: 'analytics', label: 'Аналитика Рисков', icon: BarChart3, group: 'core', requiredCapability: 'canEscalate' },
    { id: 'settings', label: 'Настройки Ядра', icon: Settings, group: 'system', requiredCapability: 'canSign' },
];

export const DomainTree: React.FC = () => {
    const capabilities = useAuthority();

    const filteredItems = NAVIGATION_ITEMS.filter(item => {
        if (!item.requiredCapability) return true;
        return capabilities[item.requiredCapability];
    });

    const renderGroup = (label: string, groupItems: NavItem[]) => (
        <div className="mb-8 last:mb-0">
            <h3 className="px-4 mb-3 text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">{label}</h3>
            <div className="space-y-1">
                {groupItems.map(item => (
                    <button
                        key={item.id}
                        className={cn(
                            "w-full flex items-center space-x-3 px-4 py-2.5 rounded-2xl text-sm transition-all group",
                            item.id === 'dashboard' ? "bg-black text-white shadow-lg shadow-black/10" : "text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <item.icon className={cn("w-4 h-4", item.id === 'dashboard' ? "text-white" : "text-gray-400 group-hover:text-black")} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <aside className="w-72 border-r border-black/5 h-[calc(100vh-64px)] p-6 overflow-y-auto bg-white/50 backdrop-blur-sm sticky top-16">
            {renderGroup('Ядро', filteredItems.filter(i => i.group === 'core'))}
            {renderGroup('Домены', filteredItems.filter(i => i.group === 'domains'))}
            {renderGroup('Система', filteredItems.filter(i => i.group === 'system'))}

            <div className="mt-auto pt-8">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Level F Secure</span>
                    </div>
                    <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                        Все действия в этом сеансе фиксируются в Immutable Ledger.
                    </p>
                </div>
            </div>
        </aside>
    );
};
