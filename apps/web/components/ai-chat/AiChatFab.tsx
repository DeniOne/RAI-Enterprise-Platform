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
                bg-white border border-black/10 shadow-xl
                flex items-center justify-center
                hover:shadow-2xl hover:scale-105 hover:bg-gray-50
                transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                focus:outline-none focus:ring-2 focus:ring-black/20
                group
            `}
            aria-label="Открыть AI Ассистента (Ctrl+K)"
            title="AI Ассистент (Ctrl+K)"
        >
            <Sprout className="w-6 h-6 text-gray-900 group-hover:text-black transition-colors duration-200" />

            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </button>
    );
}
