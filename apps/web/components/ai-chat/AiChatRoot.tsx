'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

export function AiChatRoot() {
    const dispatch = useAiChatStore((state) => state.dispatch);
    const setRouteAndReset = useWorkspaceContextStore((s) => s.setRouteAndReset);
    const pathname = usePathname();
    const isFirstMount = useRef(true);

    // Context Effect: Обновляем контекст при смене роута
    useEffect(() => {
        setRouteAndReset(pathname);
    }, [pathname, setRouteAndReset]);

    // Cleanup / Route Change Handler
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        dispatch('ROUTE_CHANGE');
    }, [pathname, dispatch]);

    // Глобальные Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Открываем чат по Ctrl+K или Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                dispatch('OPEN');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    return null;
}
