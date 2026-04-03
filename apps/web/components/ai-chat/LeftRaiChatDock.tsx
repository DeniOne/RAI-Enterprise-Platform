'use client';

import React, { useEffect, useState } from 'react';
import { AiChatPanel } from './AiChatPanel';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';

export function LeftRaiChatDock() {
    const {
        fsmState,
        dispatch,
        chatWidth,
        setChatWidth,
    } = useAiChatStore();
    const [isResizing, setIsResizing] = useState(false);
    const dockInset = 4;
    const dockHeight = `calc(100dvh - ${dockInset * 2}px)`;

    useEffect(() => {
        if (fsmState === 'closed') {
            dispatch('OPEN');
        }
    }, [dispatch, fsmState]);

    useEffect(() => {
        if (!isResizing) {
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            setChatWidth(event.clientX - 24);
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, setChatWidth]);

    return (
        <aside className="relative shrink-0" style={{ width: `${chatWidth}px` }} aria-label="Панель чата">
            <div
                className="fixed left-0 z-[60] flex flex-col"
                style={{
                    top: `${dockInset}px`,
                    width: `${chatWidth}px`,
                    height: dockHeight,
                }}
            >
                <div className="relative flex h-full flex-col">
                    <button
                        type="button"
                        onPointerDown={(event) => {
                            event.preventDefault();
                            setIsResizing(true);
                        }}
                        className="absolute -right-3 top-0 z-20 h-full w-6 cursor-ew-resize"
                        aria-label="Изменить ширину чата"
                        title="Потяните, чтобы изменить ширину"
                    >
                        <span className="absolute right-2 top-1/2 h-24 w-[3px] -translate-y-1/2 rounded-full bg-black/10 transition-colors hover:bg-black/25" />
                    </button>

                    <AiChatPanel variant="shell" shellHeight={dockHeight} />
                </div>
            </div>
        </aside>
    );
}
