import type { ReactNode } from 'react'

interface PageHeaderProps {
    title: string
    subtitle?: string
    children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="text-ui-text font-display text-2xl font-bold">{title}</h1>
                {subtitle && <p className="text-ui-muted text-sm">{subtitle}</p>}
            </div>
            {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
        </div>
    )
}
