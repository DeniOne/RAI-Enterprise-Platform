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
        <div className={clsx('inline-flex items-center gap-2 border-b border-black/5 w-full', className)}>
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
            data-state={isActive ? 'active' : 'inactive'}
            className={clsx(
                'inline-flex items-center justify-center whitespace-nowrap px-4 py-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 tracking-tight border-b-2 -mb-[1px]',
                isActive
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-200',
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

    return (
        <div
            className={clsx('mt-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 animate-in fade-in slide-in-from-bottom-2 duration-500', className)}
        >
            {children}
        </div>
    );
}
