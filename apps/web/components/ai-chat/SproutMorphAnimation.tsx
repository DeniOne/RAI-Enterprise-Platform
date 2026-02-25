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

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    ref={overlayRef}
                    tabIndex={-1}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isClosing ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    onAnimationComplete={handleAnimationComplete}
                    className="fixed inset-0 z-[100000] flex items-end justify-end p-6 bg-black/10 backdrop-blur-[2px] outline-none"
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
                        initial={{ scale: 0.8, y: 50, opacity: 0, originX: 1, originY: 1 }}
                        animate={{
                            scale: isClosing ? 0.8 : 1,
                            y: isClosing ? 50 : 0,
                            opacity: isClosing ? 0 : 1
                        }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
