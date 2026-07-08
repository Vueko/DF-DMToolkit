import { useEffect, useMemo, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useVaultStore } from '../../vault/vaultStore'
import { preprocessNoteMarkdown } from '../../vault/noteMarkdown'
import { remarkCallouts } from '../../vault/remarkCallouts'
import { slugifyHeading } from '../../vault/slug'
import {
    FileTextIcon, SquareIcon, LightbulbIcon, AlertIcon, ClipboardIcon, CheckCircleIcon,
    HelpCircleIcon, XCircleIcon, FlameIcon, BugIcon, RulerIcon, QuoteIcon, ImageIcon,
    InfoIcon, WarningIcon,
} from '../icons'

interface VaultMarkdownProps {
    body: string
    onNavigate: (notePath: string, heading: string | null) => void
}

function HeadingRenderer(Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') {
    return ({ children }: { children?: ReactNode }) => {
        const text = extractFirstText(children) ?? ''
        return <Tag id={slugifyHeading(text)}>{children}</Tag>
    }
}

// Hoisted once (avoids creating new component identities on every render).
const H1 = HeadingRenderer('h1')
const H2 = HeadingRenderer('h2')
const H3 = HeadingRenderer('h3')
const H4 = HeadingRenderer('h4')
const H5 = HeadingRenderer('h5')
const H6 = HeadingRenderer('h6')

const EXT_MIME: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp',
}

function mimeFor(rel: string): string {
    const dot = rel.lastIndexOf('.')
    return dot === -1 ? '' : (EXT_MIME[rel.slice(dot + 1).toLowerCase()] ?? '')
}

function VaultImage({ rel, alt }: { rel: string; alt: string }) {
    const [url, setUrl] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)
    useEffect(() => {
        let revoked: string | null = null
        let cancelled = false
        // Intentional: reset the failure flag when the image path changes before re-fetching.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFailed(false)
        window.electron.vault.readImage(rel).then((data) => {
            if (cancelled) return
            if (!data) {
                if (import.meta.env.DEV) console.warn('[vault] readImage returned null for rel:', JSON.stringify(rel))
                setFailed(true)
                return
            }
            // Give the Blob the right MIME type so Chromium renders it (esp. SVG).
            const blob = new Blob([data as BlobPart], { type: mimeFor(rel) })
            const objectUrl = URL.createObjectURL(blob)
            revoked = objectUrl
            setUrl(objectUrl)
        })
        return () => {
            cancelled = true
            if (revoked) URL.revokeObjectURL(revoked)
        }
    }, [rel])
    if (failed) return <span className="text-ui-muted text-xs italic"><ImageIcon className="w-4 h-4 inline"/> imagen no encontrada: {rel}</span>
    if (!url) return <span className="text-ui-muted text-xs italic">cargando imagen…</span>
    return <img src={url} alt={alt} className="max-w-full h-auto rounded-lg border border-ui-surface2 my-2" />
}

// --- Callouts ----------------------------------------------------------------
// Colors live in index.css (.callout-<type>); here we only map type -> icon/label.
// Detection is by className (reliably passed by react-markdown), set by remarkCallouts.

const CALLOUT_META: Record<string, { icon: ReactNode; label: string }> = {
    note: { icon: <FileTextIcon className="w-4 h-4"/>, label: 'Note' },
    info: { icon: <InfoIcon className="w-4 h-4"/>, label: 'Info' },
    todo: { icon: <SquareIcon className="w-4 h-4"/>, label: 'Todo' },
    tip: { icon: <LightbulbIcon className="w-4 h-4"/>, label: 'Tip' },
    hint: { icon: <LightbulbIcon className="w-4 h-4"/>, label: 'Hint' },
    important: { icon: <AlertIcon className="w-4 h-4"/>, label: 'Important' },
    abstract: { icon: <ClipboardIcon className="w-4 h-4"/>, label: 'Abstract' },
    summary: { icon: <ClipboardIcon className="w-4 h-4"/>, label: 'Summary' },
    tldr: { icon: <ClipboardIcon className="w-4 h-4"/>, label: 'TL;DR' },
    success: { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Success' },
    check: { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Check' },
    done: { icon: <CheckCircleIcon className="w-4 h-4"/>, label: 'Done' },
    question: { icon: <HelpCircleIcon className="w-4 h-4"/>, label: 'Question' },
    help: { icon: <HelpCircleIcon className="w-4 h-4"/>, label: 'Help' },
    faq: { icon: <HelpCircleIcon className="w-4 h-4"/>, label: 'FAQ' },
    warning: { icon: <WarningIcon className="w-4 h-4"/>, label: 'Warning' },
    caution: { icon: <WarningIcon className="w-4 h-4"/>, label: 'Caution' },
    attention: { icon: <WarningIcon className="w-4 h-4"/>, label: 'Attention' },
    failure: { icon: <XCircleIcon className="w-4 h-4"/>, label: 'Failure' },
    fail: { icon: <XCircleIcon className="w-4 h-4"/>, label: 'Fail' },
    missing: { icon: <XCircleIcon className="w-4 h-4"/>, label: 'Missing' },
    danger: { icon: <FlameIcon className="w-4 h-4"/>, label: 'Danger' },
    error: { icon: <FlameIcon className="w-4 h-4"/>, label: 'Error' },
    bug: { icon: <BugIcon className="w-4 h-4"/>, label: 'Bug' },
    example: { icon: <RulerIcon className="w-4 h-4"/>, label: 'Example' },
    quote: { icon: <QuoteIcon className="w-4 h-4"/>, label: 'Quote' },
    cite: { icon: <QuoteIcon className="w-4 h-4"/>, label: 'Cite' },
}

function Callout({ type, title, children }: { type: string; title: string; children: ReactNode }) {
    const meta = CALLOUT_META[type] ?? CALLOUT_META.note
    return (
        <div className={`callout callout-${type}`}>
            <div className="callout-header">
                <span className="callout-icon" aria-hidden>{meta.icon}</span>
                <span>{title || meta.label}</span>
            </div>
            <div className="callout-body">{children}</div>
        </div>
    )
}

const REMARK_PLUGINS = [remarkGfm, remarkCallouts]

// react-markdown percent-encodes URL destinations (e.g. spaces -> %20). Decode
// back to the real vault path before hitting the filesystem via IPC.
function safeDecode(s: string): string {
    try { return decodeURI(s) } catch { return s }
}

function urlTransform(url: string): string {
    if (url.startsWith('vault-note:') || url.startsWith('vault-img:')) return url
    if (url.startsWith('https://') || url.startsWith('http://')) return url
    if (url.startsWith('#') || !url.includes(':')) return url
    return ''
}

export function VaultMarkdown({ body, onNavigate }: VaultMarkdownProps) {
    const noteIndex = useVaultStore((s) => s.noteIndex)
    const imageIndex = useVaultStore((s) => s.imageIndex)

    const processed = useMemo(
        () => preprocessNoteMarkdown(body, noteIndex, imageIndex),
        [body, noteIndex, imageIndex],
    )

    return (
        <ReactMarkdown
            urlTransform={urlTransform}
            remarkPlugins={REMARK_PLUGINS}
            components={{
                h1: H1,
                h2: H2,
                h3: H3,
                h4: H4,
                h5: H5,
                h6: H6,
                div: ({ className, node, children }) => {
                    const classes = typeof className === 'string' ? className.split(/\s+/) : []
                    if (classes.includes('callout')) {
                        const typeClass = classes.find((c) => c.startsWith('callout-'))
                        const type = typeClass ? typeClass.slice('callout-'.length) : 'note'
                        const titleProp = (node as { properties?: Record<string, unknown> } | undefined)?.properties?.dataCalloutTitle
                        const title = typeof titleProp === 'string' ? titleProp : ''
                        return <Callout type={type} title={title}>{children}</Callout>
                    }
                    return <div className={className}>{children}</div>
                },
                a: ({ href, children }) => {
                    if (href?.startsWith('vault-note:')) {
                        const raw = href.slice('vault-note:'.length)
                        const hashIdx = raw.indexOf('#')
                        // React percent-encodes spaces in the href, so decode back to the real path.
                        const notePath = safeDecode(hashIdx === -1 ? raw : raw.slice(0, hashIdx))
                        const heading = hashIdx === -1 ? null : safeDecode(raw.slice(hashIdx + 1))
                        return (
                            <a
                                href={href}
                                onClick={(e) => { e.preventDefault(); onNavigate(notePath, heading) }}
                                className="text-danger-gold hover:text-danger-yellow font-medium cursor-pointer bg-danger-gold/10 hover:bg-danger-gold/20 px-1 py-0.5 rounded transition-colors no-underline"
                            >
                                {children}
                            </a>
                        )
                    }
                    const isSafe = href?.startsWith('https://') || href?.startsWith('http://')
                    if (!isSafe) return <span className="text-ui-muted">{children}</span>
                    return <a href={href} target="_blank" rel="noreferrer" className="text-sky-600 hover:text-sky-500 underline decoration-sky-600/40">{children}</a>
                },
                img: ({ src, alt }) => {
                    if (typeof src === 'string' && src.startsWith('vault-img:')) {
                        // React percent-encodes spaces in src; decode to the real file path.
                        return <VaultImage rel={safeDecode(src.slice('vault-img:'.length))} alt={alt ?? ''} />
                    }
                    // Standard markdown image with a relative (non-URL) path → resolve
                    // through the vault index by basename (so "foo.png" finds imagenes/foo.png).
                    if (typeof src === 'string' && src && !/^(https?:|data:|blob:)/.test(src)) {
                        const p = safeDecode(src)
                        const base = p.slice(p.lastIndexOf('/') + 1).toLowerCase()
                        const resolved = imageIndex.get(p.toLowerCase()) ?? imageIndex.get(base) ?? p
                        return <VaultImage rel={resolved} alt={alt ?? ''} />
                    }
                    return <img src={src} alt={alt} className="max-w-full h-auto rounded-lg" />
                },
            }}
        >
            {processed}
        </ReactMarkdown>
    )
}

function extractFirstText(node: unknown): string | null {
    if (node == null) return null
    if (typeof node === 'string') return node
    if (typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
        const props = (node as { props?: { children?: unknown } }).props
        if (props && 'children' in props) {
            const ch = props.children
            if (typeof ch === 'string') return ch
            if (Array.isArray(ch)) {
                for (const c of ch) {
                    const t = extractFirstText(c)
                    if (t) return t
                }
            }
            return extractFirstText(ch)
        }
    }
    return null
}
