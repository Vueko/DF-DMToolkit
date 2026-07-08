import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
    size?: 'sm' | 'md'
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-accent text-accent-fg hover:opacity-90',
    secondary: 'bg-ui-surface2 border border-ui-surface2 hover:border-arcane-light/50 text-ui-text',
    ghost: 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60',
    destructive: 'text-red-500 hover:text-red-600 hover:bg-red-500/10',
}

const SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            className={`rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT[variant]} ${SIZE[size]} ${className}`}
        >
            {children}
        </button>
    )
}
