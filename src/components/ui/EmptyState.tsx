import type { ReactNode } from 'react'

interface EmptyStateProps {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
    size?: 'sm' | 'md'
}

export function EmptyState({ icon, title, description, action, size = 'md' }: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center text-center gap-2 ${size === 'sm' ? 'py-6' : 'py-12'}`}>
            {icon && <div className={size === 'sm' ? 'text-3xl' : 'text-5xl'}>{icon}</div>}
            <p className="text-ui-text text-sm font-medium">{title}</p>
            {description && <p className="text-ui-muted text-xs">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    )
}
