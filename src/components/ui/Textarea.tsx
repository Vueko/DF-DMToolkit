import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    theme?: 'arcane' | 'danger'
}

const THEME: Record<NonNullable<TextareaProps['theme']>, string> = {
    arcane: 'focus:border-arcane-light',
    danger: 'focus:border-danger-primary',
}

export function Textarea({ theme = 'arcane', className = '', ...props }: TextareaProps) {
    return (
        <textarea
            {...props}
            className={`bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-2 rounded-lg outline-none transition-colors placeholder:text-ui-muted resize-none w-full ${THEME[theme]} ${className}`}
        />
    )
}
