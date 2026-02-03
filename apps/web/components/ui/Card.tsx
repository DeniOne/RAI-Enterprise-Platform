import React from 'react'

interface CardProps {
    children: React.ReactNode
    className?: string
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-white border border-black/10 rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    )
}
