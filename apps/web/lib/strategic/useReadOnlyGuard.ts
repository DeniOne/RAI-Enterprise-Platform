'use client';

import { useEffect } from 'react';

/**
 * 🔒 useReadOnlyGuard
 * Хук для блокировки любых попыток мутации данных на фронте в фазе Beta.
 * В идеале вызывается в корне стратегических Views.
 */
export function useReadOnlyGuard() {
    useEffect(() => {
        // 🚩 STRATEGIC_FRONT_BETA check
        const isStrategic = window.location.pathname.includes('/strategic');

        if (!isStrategic) return;

        const blockEvent = (e: Event) => {
            // Разрешаем только навигационные клики и логаут
            const target = e.target as HTMLElement;
            const isNavigation = target.closest('a') || target.closest('button[type="submit"]');

            if (!isNavigation) {
                // e.preventDefault();
                // e.stopPropagation();
                // console.warn('[RAI_EP] Architectural Violation: Mutation attempt blocked in Strategic Projection.');
            }
        };

        // Слушаем формы на всякий случай
        const blockSubmit = (e: SubmitEvent) => {
            if ((e.target as HTMLFormElement).action.includes('/api/auth/logout')) return;

            e.preventDefault();
            console.error('[RAI_EP] Critical Error: Form submission is forbidden in Strategic Frontend.');
        };

        window.addEventListener('submit', blockSubmit, true);

        return () => {
            window.removeEventListener('submit', blockSubmit, true);
        };
    }, []);
}
