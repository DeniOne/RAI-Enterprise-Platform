import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'default' | 'icon';
    asChild?: boolean; // Mocked for now to avoid Radix dependency
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, variant = 'primary', size = 'default', asChild, loading, className, disabled, ...props }, ref) => {
        // If asChild is true, we should ideally render the child with these classes.
        // Simplifying to standard button to ensure build passes without Radix.
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={clsx(
                    'inline-flex items-center justify-center rounded-2xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:opacity-50',
                    {
                        'bg-black text-white hover:bg-gray-800': variant === 'primary',
                        'bg-white border border-black/10 text-gray-900 hover:bg-gray-50': variant === 'secondary',
                        'bg-transparent hover:bg-gray-100/50 text-gray-600 hover:text-gray-900': variant === 'ghost',
                    },
                    {
                        'px-6 py-3': size === 'default',
                        'h-10 w-10 p-0': size === 'icon',
                    },
                    className
                )}
                {...props}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
