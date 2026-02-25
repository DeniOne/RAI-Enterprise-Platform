import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        const inputNode = (
            <input
                ref={ref}
                className={clsx(
                    'flex h-10 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all',
                    error ? 'border-red-300 focus-visible:ring-red-200' : null,
                    className
                )}
                {...props}
            />
        );

        if (!label && !error) {
            return inputNode;
        }

        return (
            <label className="block space-y-1">
                {label ? <span className="text-xs font-medium text-gray-700">{label}</span> : null}
                {inputNode}
                {error ? <span className="text-xs text-red-600">{error}</span> : null}
            </label>
        );
    }
);

Input.displayName = 'Input';
