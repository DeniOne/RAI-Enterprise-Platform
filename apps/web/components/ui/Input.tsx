import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="space-y-2">
                {label && (
                    <label className="text-sm font-normal text-gray-700 block">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            w-full border border-black/10 rounded-lg px-4 py-2 font-normal
            focus:ring-2 focus:ring-black/20 focus:border-black/20 outline-none
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>
        )
    }
)

Input.displayName = 'Input'
