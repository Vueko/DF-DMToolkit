import type { ReactNode } from 'react'
import type { SessionItem, SessionItemKind } from '../../types/sessionItem'
import { SharedMarkdown } from '../SharedMarkdown'
import { LightbulbIcon, ScrollIcon, QuoteIcon, FileTextIcon } from '../icons'
import { useT } from '../../i18n'

// eslint-disable-next-line react-refresh/only-export-components
export const KIND_CONFIG: Record<SessionItemKind, {
    icon: ReactNode
    sectionKey: string
    kindKey: string
    addKey: string
    verbKey: string
    bg: string
    border: string
    text: string
}> = {
    clue:    { icon: <LightbulbIcon className="w-3.5 h-3.5" />, sectionKey: 'sessionItem.sectionClues',    kindKey: 'sessionItem.kindClue',    addKey: 'sessionItem.addClue',    verbKey: 'sessionItem.verbReveal',  bg: 'bg-cyan-500/10',     border: 'border-cyan-500/30',     text: 'text-cyan-700' },
    loot:    { icon: <ScrollIcon className="w-3.5 h-3.5" />,    sectionKey: 'sessionItem.sectionLoot',     kindKey: 'sessionItem.kindLoot',    addKey: 'sessionItem.addLoot',    verbKey: 'sessionItem.verbGive',    bg: 'bg-danger-gold/10',  border: 'border-danger-gold/30',  text: 'text-danger-gold' },
    message: { icon: <QuoteIcon className="w-3.5 h-3.5" />,     sectionKey: 'sessionItem.sectionMessages', kindKey: 'sessionItem.kindMessage', addKey: 'sessionItem.addMessage', verbKey: 'sessionItem.verbDeliver', bg: 'bg-amber-500/10',    border: 'border-amber-400/30',    text: 'text-amber-700' },
    note:    { icon: <FileTextIcon className="w-3.5 h-3.5" />,  sectionKey: 'sessionItem.sectionNotes',    kindKey: 'sessionItem.kindNote',    addKey: 'sessionItem.addNote',    verbKey: '',                        bg: 'bg-arcane-light/10', border: 'border-arcane-light/25', text: 'text-arcane-light' },
}

function RowActions({ onEdit, onRemove, editTitle, deleteTitle }: {
    onEdit: () => void; onRemove: () => void; editTitle: string; deleteTitle: string
}) {
    return (
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={onEdit} title={editTitle} className="text-card-text/40 hover:text-card-text text-[11px]">✎</button>
            <button type="button" onClick={onRemove} title={deleteTitle} className="text-card-text/40 hover:text-red-600 text-[11px] font-bold">✕</button>
        </div>
    )
}

function SessionItemRow({ item, onToggle, onEdit, onRemove }: {
    item: SessionItem
    onToggle: () => void
    onEdit: () => void
    onRemove: () => void
}) {
    const t = useT()
    const cfg = KIND_CONFIG[item.kind]
    const actions = <RowActions onEdit={onEdit} onRemove={onRemove} editTitle={t('sessionItem.editTitle')} deleteTitle={t('sessionItem.delete')} />

    if (item.kind === 'note') {
        return (
            <div className={`group flex items-start gap-2 ${cfg.bg} ${cfg.border} border rounded-lg px-2.5 py-2`}>
                <span className={`shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-card-text leading-tight">{item.title}</p>
                    {item.body && (
                        <div className="prose prose-sm max-w-none text-[11px] text-card-text/75 mt-0.5">
                            <SharedMarkdown>{item.body}</SharedMarkdown>
                        </div>
                    )}
                </div>
                {actions}
            </div>
        )
    }

    return (
        <div className={`group flex items-start gap-2 ${cfg.bg} ${cfg.border} border rounded-lg px-2.5 py-2 ${item.done ? 'opacity-50' : ''}`}>
            <button
                type="button"
                onClick={onToggle}
                title={t(item.done ? 'sessionItem.markUndone' : cfg.verbKey)}
                className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    item.done ? `${cfg.text} border-current` : 'border-card-text/40 hover:border-current'
                }`}
            >
                {item.done && <span className="text-[9px] font-black">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold text-card-text leading-tight ${item.done ? 'line-through' : ''}`}>{item.title}</p>
                {item.body && (
                    <p className="text-[11px] text-card-text/70 leading-snug mt-0.5 line-clamp-2">
                        {item.body.replace(/[#*_`[\]]/g, '').trim()}
                    </p>
                )}
            </div>
            {actions}
        </div>
    )
}

export default SessionItemRow
