import type { ReactNode } from 'react'

export function renderBold(text: string): ReactNode {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    if (parts.length === 1) return text
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <strong key={i}>{part.slice(2, -2)}</strong>
            : part
    )
}
