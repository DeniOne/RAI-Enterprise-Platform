'use client';

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { AiChatFab } from './AiChatFab';

// Ленивая загрузка Overlay — только когда FSM не в closed
const SproutMorphAnimation = dynamic(
    () => import('./SproutMorphAnimation').then(mod => mod.SproutMorphAnimation),
    { ssr: false }
);

export function AiChatRoot() {
    const { fsmState, dispatch, updateContext } = useAiChatStore();
    const pathname = usePathname();
    const isFirstMount = useRef(true);

    // Context Effect: Обновляем контекст при смене роута
    useEffect(() => {
        updateContext({ route: pathname });
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup / Route Change Handler
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        dispatch('ROUTE_CHANGE');
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // Глобальные Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Открываем чат по Ctrl+K или Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                dispatch('OPEN');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    const isVisible = fsmState !== 'closed';

    return (
        <>
            <AiChatFab />

            {/* Рендерим тяжелые анимации/модалки только когда они нужны */}
            {isVisible && (
                <SproutMorphAnimation />
            )}
        </>
    );
}
