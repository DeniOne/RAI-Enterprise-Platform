'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { AiChatPanel } from './AiChatPanel';

export function SproutMorphAnimation() {
    const { fsmState, dispatch } = useAiChatStore();
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Escape для закрытия
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                dispatch('CLOSE');
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Focus trap: автофокус на overlay при открытии (или на инпут панели позже)
        if (overlayRef.current) overlayRef.current.focus();

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch]);

    // Анимация завершения OPEN/CLOSE
    const handleAnimationComplete = (definition: any) => {
        if (fsmState === 'animating_open' && definition.opacity === 1) {
            dispatch('ANIMATION_OPEN_DONE');
        }
        if (fsmState === 'animating_close' && definition.opacity === 0) {
            dispatch('ANIMATION_CLOSE_DONE');
        }
    };

    const isVisible = fsmState === 'animating_open' || fsmState === 'open' || fsmState === 'animating_close';
    const isClosing = fsmState === 'animating_close';

    const isFocusMode = useAiChatStore((state) => state.panelMode === 'focus');

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={overlayRef}
                    tabIndex={-1}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isClosing ? 0 : 1 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    onAnimationComplete={handleAnimationComplete}
                    className={`fixed inset-0 z-[100000] flex outline-none ${
                        isFocusMode ? 'items-center justify-center p-4 bg-black/15 backdrop-blur-[3px]' : 'items-end justify-end p-6 bg-black/10 backdrop-blur-[2px]'
                    }`}
                    aria-modal="true"
                    role="dialog"
                    aria-label="AI Ассистент"
                    onClick={(e) => {
                        // Клик по бекдропу закрывает чат
                        if (e.target === e.currentTarget) dispatch('CLOSE');
                    }}
                >
                    {/* Контейнер панели */}
                    <motion.div
                        initial={{ scale: 0.94, y: isFocusMode ? 12 : 36, opacity: 0, originX: 1, originY: 1 }}
                        animate={{
                            scale: isClosing ? 0.98 : 1,
                            y: isClosing ? (isFocusMode ? 12 : 24) : 0,
                            opacity: isClosing ? 0 : 1
                        }}
                        transition={{ type: "spring", damping: 28, stiffness: 340, mass: 0.8 }}
                        className="relative"
                        onClick={(e) => e.stopPropagation()} // Защита от закрытия по клику внутри
                    >
                        <AiChatPanel />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
