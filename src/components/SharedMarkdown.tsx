import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useNavigate } from 'react-router-dom'
import { useVaultStore } from '../vault/vaultStore'
import { parseWikiTarget } from '../vault/wikilinks'
import { unescapeMarkdown } from '../utils/markdown'
import { LinkIcon } from './icons'

interface SharedMarkdownProps {
    children: string
}

export function SharedMarkdown({ children }: SharedMarkdownProps) {
    const navigate = useNavigate()
    const resolve = useVaultStore((s) => s.resolve)
    const noteIndex = useVaultStore((s) => s.noteIndex)

    const processedText = useMemo(() => {
        if (!children) return ''
        // Normaliza escapes literales del SRD (\n, \t…) antes de resolver wikilinks; sin esto
        // las tablas de objetos como el Spell Scroll se renderizan como texto con barras.
        return unescapeMarkdown(children).replace(/\[\[([^\]]+)\]\]/g, (_match, inner: string) => {
            const { name, alias } = parseWikiTarget(inner)
            const path = resolve(name)
            if (path) return `[${alias || name}](/journal?note=${encodeURIComponent(path)})`
            return alias || name
        })
    // noteIndex en deps para recomputar cuando carga el vault
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [children, resolve, noteIndex])

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                a: ({ href, children }) => {
                    if (href?.startsWith('/journal?note=')) {
                        return (
                            <a
                                href={href}
                                onClick={(e) => { e.preventDefault(); navigate(href) }}
                                className="text-danger-gold hover:text-danger-primary font-semibold cursor-pointer transition-colors bg-danger-primary/10 px-1 rounded inline-flex items-center gap-1"
                                title="Abrir en World Wiki"
                            >
                                <LinkIcon className="w-3 h-3" />{children}
                            </a>
                        )
                    }
                    const isSafe = href?.startsWith('https://') || href?.startsWith('http://')
                    if (!isSafe) return <span className="text-danger-primary underline">{children}</span>
                    return <a href={href} target="_blank" rel="noreferrer" className="text-danger-primary hover:text-danger-gold underline">{children}</a>
                },
            }}
        >
            {processedText}
        </ReactMarkdown>
    )
}
