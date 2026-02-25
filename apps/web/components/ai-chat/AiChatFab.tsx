'use client';

import React from 'react';
import { Sprout } from 'lucide-react';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';

export function AiChatFab() {
    const { fsmState, dispatch } = useAiChatStore();

    // Показывать только если закрыто
    if (fsmState !== 'closed') return null;

    return (
        <button
            onClick={() => dispatch('OPEN')}
            className={`
                fixed bottom-6 right-6 z-[9999] 
                w-14 h-14 rounded-full
                bg-slate-900 border border-slate-700 shadow-xl
                flex items-center justify-center
                hover:shadow-2xl hover:scale-105 hover:bg-slate-800
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50
                group
            `}
            aria-label="Открыть AI Ассистента (Ctrl+K)"
            title="AI Ассистент (Ctrl+K)"
        >
            <Sprout className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />

            {/* Пульсирующий индикатор (мягкий акцент) */}
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 group-hover:border-slate-800 animate-pulse transition-colors duration-300" />
        </button>
    );
}
