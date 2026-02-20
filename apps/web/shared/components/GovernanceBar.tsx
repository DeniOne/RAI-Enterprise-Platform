'use client';

import React from 'react';
import { useAuthority, UserRole } from '@/core/governance/AuthorityContext';
import { useAuthSimulationStore } from '@/core/governance/Providers';
import { Shield, Activity, Fingerprint, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useSessionIntegrity } from '@/shared/hooks/useSessionIntegrity';

export const GovernanceBar: React.FC = () => {
    const { currentRole, setRole } = useAuthSimulationStore();
    const { canOverride, canApprove } = useAuthority();
    const { traceId, integrityStatus } = useSessionIntegrity();

    return (
        <header className="h-16 border-b border-black/5 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
            {/* Left: Branding & Integrity */}
            <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                        <Shield className="text-white w-5 h-5" />
                    </div>
                    <span className="font-medium tracking-tight text-lg">RAI <span className="text-gray-400 font-normal">Control Plane</span></span>
                </div>

                <div className="h-4 w-px bg-gray-200" />

                <div className="flex items-center space-x-4 text-xs font-mono text-gray-500">
                    <div className="flex items-center space-x-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-blue-500" />
                        <span>TRACE: <span className="text-black">{traceId}</span></span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                        <Activity className={cn("w-3.5 h-3.5", integrityStatus === 'VERIFIED' ? "text-green-500" : "text-yellow-500")} />
                        <span>LEDGER: <span className="text-black uppercase">{integrityStatus}</span></span>
                    </div>
                </div>
            </div>

            {/* Right: Role Simulator & Capabilities Indicators */}
            <div className="flex items-center space-x-4">
                {/* Capabilities Badge (Visual Proof of AuthorityContext consumption) */}
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full border border-black/5">
                    <div className={cn("w-2 h-2 rounded-full", canOverride ? "bg-red-500 animate-pulse" : "bg-gray-300")} title="Override Power" />
                    <div className={cn("w-2 h-2 rounded-full", canApprove ? "bg-green-500" : "bg-gray-300")} title="Approval Power" />
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Rights active</span>
                </div>

                {/* Role Simulator Dropdown */}
                <div className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/90 transition-all shadow-lg shadow-black/10">
                        <span>Simulate: {currentRole}</span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>

                    <div className="absolute right-0 mt-2 w-48 bg-white border border-black/5 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-[60]">
                        {(['CEO', 'DIRECTOR', 'MANAGER', 'AGRONOMIST', 'GUEST'] as UserRole[]).map((role) => (
                            <button
                                key={role}
                                onClick={() => setRole(role)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl text-xs transition-colors",
                                    currentRole === role ? "bg-gray-100 font-medium" : "hover:bg-gray-50 text-gray-500"
                                )}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
};
