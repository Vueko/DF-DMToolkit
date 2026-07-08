import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    theme?: 'arcane' | 'danger'
}

const THEME: Record<NonNullable<SelectProps['theme']>, string> = {
    arcane: 'focus:border-arcane-light',
    danger: 'focus:border-danger-primary',
}

export function Select({ theme = 'arcane', className = '', children, ...props }: SelectProps) {
    return (
        <select
            {...props}
            className={`bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none transition-colors w-full ${THEME[theme]} ${className}`}
        >
            {children}
        </select>
    )
}
