import React from 'react';
import clsx from 'clsx';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx('bg-white border border-black/10 rounded-2xl p-6 shadow-sm overflow-hidden', className)}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={clsx('flex flex-col space-y-1.5 mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h3 className={clsx('text-lg font-medium leading-none tracking-tight text-gray-900', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={clsx('pt-0', className)}>{children}</div>;
}
