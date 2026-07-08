import type { ReactNode } from 'react'

interface PanelProps {
    size?: 'default' | 'spacious'
    className?: string
    children: ReactNode
}

export function Panel({ size = 'default', className = '', children }: PanelProps) {
    return (
        <div className={`bg-ui-surface rounded-xl border border-ui-surface2 ${size === 'spacious' ? 'p-5' : 'p-4'} ${className}`}>
            {children}
        </div>
    )
}
