'use client';

import * as React from 'react';
import clsx from 'clsx';

const TabsContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
}>({
    value: '',
    onValueChange: () => { },
});

export function Tabs({
    defaultValue,
    value: controlledValue,
    onValueChange,
    children,
    className,
}: {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}) {
    const [value, setValue] = React.useState(controlledValue || defaultValue || '');

    const handleChange = React.useCallback(
        (newValue: string) => {
            setValue(newValue);
            onValueChange?.(newValue);
        },
        [onValueChange]
    );

    return (
        <TabsContext.Provider value={{ value: controlledValue || value, onValueChange: handleChange }}>
            <div className={clsx('w-full', className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx('inline-flex items-center justify-center rounded-xl bg-slate-100/80 p-1 text-gray-500', className)}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    const isActive = context.value === value;

    return (
        <button
            type="button"
            onClick={() => context.onValueChange(value)}
            className={clsx(
                'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:opacity-50',
                isActive ? 'bg-white text-black shadow-sm' : 'hover:bg-white/50 hover:text-gray-900',
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;

    return <div className={clsx('mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20', className)}>{children}</div>;
}
