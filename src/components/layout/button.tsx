'use client'

import React from 'react'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean
    variant?: 'primary' | 'secondary'
}

export const Button = ({
    loading = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) => {
    return (
        <button
            disabled={disabled || loading}
            className={`
        w-full h-12 lg:h-13
        rounded-xl font-semibold text-sm lg:text-base
        flex items-center justify-center gap-2
        transition-all duration-200
        active:scale-[0.99]

        ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-800'}

        bg-slate-900 text-white

        disabled:opacity-60 disabled:cursor-not-allowed

        ${className}
      `}
            {...props}
        >
            {loading ? (
                <>
                    <svg
                        className="w-5 h-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="opacity-25"
                        />
                        <path
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            fill="currentColor"
                            className="opacity-75"
                        />
                    </svg>

                    {children}
                </>
            ) : (
                children
            )}
        </button>
    )
}
