'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

type FocusContext = {
    focusEntity: string;
    focusSeverity: string;
};

type UseEntityFocusOptions<T> = {
    items: T[];
    matchItem: (item: T, context: FocusContext) => boolean;
    watch?: unknown[];
};

export function toUpper(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
}

export function includesFocus(values: unknown[], focusValue: string): boolean {
    if (!focusValue) return false;
    return values.filter(Boolean).some((v) => toUpper(v).includes(focusValue));
}

export function useEntityFocus<T>({ items, matchItem, watch = [] }: UseEntityFocusOptions<T>) {
    const searchParams = useSearchParams();
    const focusEntity = toUpper(searchParams.get('entity') || '');
    const focusSeverity = toUpper(searchParams.get('severity') || '');
    const hasFocus = Boolean(focusEntity || focusSeverity);

    const hasFocusedEntity = useMemo(() => {
        if (!hasFocus) return false;
        return items.some((item) => matchItem(item, { focusEntity, focusSeverity }));
    }, [items, matchItem, hasFocus, focusEntity, focusSeverity]);

    useEffect(() => {
        if (!hasFocus) return;
        const target = document.querySelector<HTMLElement>('[data-focus="true"]');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [hasFocus, focusEntity, focusSeverity, hasFocusedEntity, ...watch]);

    const isFocused = (item: T) => matchItem(item, { focusEntity, focusSeverity });

    return {
        focusEntity,
        focusSeverity,
        hasFocus,
        hasFocusedEntity,
        isFocused,
    };
}
