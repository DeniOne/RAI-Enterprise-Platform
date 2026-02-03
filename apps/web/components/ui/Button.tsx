import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary'
    children: React.ReactNode
}

export function Button({
    variant = 'primary',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = 'px-6 py-3 rounded-2xl font-medium transition-colors'

    const variantStyles = {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary: 'bg-white border border-black/10 hover:bg-gray-50',
    }

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}
