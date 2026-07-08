import { useState } from 'react'
import type { VaultNode } from '../../types'

interface VaultTreeProps {
    node: VaultNode
    activePath: string | null
    onSelect: (path: string) => void
    defaultOpen?: boolean
}

const iconBase = 'shrink-0'

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg viewBox="0 0 24 24" width="12" height="12" className={`${iconBase} transition-transform duration-150 ${open ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 6l6 6-6 6" />
        </svg>
    )
}

function FolderIcon({ open }: { open: boolean }) {
    return open ? (
        <svg viewBox="0 0 24 24" width="16" height="16" className={iconBase} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v1" />
            <path d="M3 9h16.2a1 1 0 0 1 .98 1.2l-1.2 6a1 1 0 0 1-.98.8H5a1 1 0 0 1-.98-.8L3 9z" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" className={iconBase} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a1 1 0 0 1 1-1h4l2 2h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z" />
        </svg>
    )
}

function NoteIcon() {
    return (
        <svg viewBox="0 0 24 24" width="14" height="14" className={iconBase} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7l-4-4z" />
            <path d="M14 3v4h4" />
        </svg>
    )
}

function NoteRow({ node, isActive, onSelect }: { node: VaultNode; isActive: boolean; onSelect: (p: string) => void }) {
    const label = node.name.replace(/\.md$/i, '')
    return (
        <button
            type="button"
            onClick={() => onSelect(node.path)}
            title={label}
            className={`group relative w-full flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-md text-left text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-danger-gold/40 ${
                isActive ? 'bg-danger-gold/10 text-danger-gold font-medium' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/50'
            }`}
        >
            {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-danger-gold" />}
            <span className={isActive ? 'text-danger-gold' : 'text-ui-muted/60 group-hover:text-ui-muted'}><NoteIcon /></span>
            <span className="truncate">{label}</span>
        </button>
    )
}

function FolderNode({ node, activePath, onSelect, defaultOpen }: VaultTreeProps) {
    const [open, setOpen] = useState(defaultOpen ?? false)
    const children = node.children ?? []
    return (
        <div className="flex flex-col">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                title={node.name}
                className="group w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors text-ui-text hover:bg-ui-surface2/50 outline-none focus-visible:ring-1 focus-visible:ring-danger-gold/40"
            >
                <span className="text-ui-muted/60 group-hover:text-ui-muted"><ChevronIcon open={open} /></span>
                <span className={open ? 'text-danger-gold/80' : 'text-ui-muted group-hover:text-ui-text'}><FolderIcon open={open} /></span>
                <span className="truncate text-sm font-medium tracking-tight">{node.name}</span>
            </button>
            {open && children.length > 0 && (
                <div className="ml-[15px] border-l border-ui-surface2/50 pl-1.5 mt-0.5 flex flex-col gap-0.5">
                    {children.map((child) => (
                        <VaultTree key={child.path} node={child} activePath={activePath} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    )
}

export function VaultTree({ node, activePath, onSelect, defaultOpen }: VaultTreeProps) {
    if (node.type === 'image') return null

    if (node.type === 'note') {
        return <NoteRow node={node} isActive={activePath === node.path} onSelect={onSelect} />
    }

    // Root folder: render children flush (no header). Top-level folders start collapsed.
    if (node.path === '') {
        const children = node.children ?? []
        return (
            <div className="flex flex-col gap-0.5">
                {children.map((child) => (
                    <VaultTree key={child.path} node={child} activePath={activePath} onSelect={onSelect} />
                ))}
            </div>
        )
    }

    return <FolderNode node={node} activePath={activePath} onSelect={onSelect} defaultOpen={defaultOpen} />
}
