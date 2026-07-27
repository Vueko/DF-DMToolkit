import type { SessionItem, SessionItemKind } from '../../types'
import type { GroupedSessionItems } from './groupSessionItems'
import SessionItemRow, { KIND_CONFIG } from './SessionItemRow'
import { useT } from '../../i18n'

const ORDER: { key: SessionItemKind; list: keyof GroupedSessionItems }[] = [
    { key: 'clue', list: 'clues' },
    { key: 'loot', list: 'loot' },
    { key: 'message', list: 'messages' },
    { key: 'note', list: 'notes' },
]

function SessionItemSections({ grouped, showEmpty, showAdd, onToggle, onEdit, onRemove, onAdd }: {
    grouped: GroupedSessionItems
    showEmpty: boolean
    showAdd: boolean
    onToggle: (item: SessionItem) => void
    onEdit: (item: SessionItem) => void
    onRemove: (item: SessionItem) => void
    onAdd: (kind: SessionItemKind) => void
}) {
    const t = useT()
    return (
        <div className="flex flex-col gap-3">
            {ORDER.map(({ key, list }) => {
                const items = grouped[list]
                if (items.length === 0 && !showEmpty) return null
                const cfg = KIND_CONFIG[key]
                return (
                    <div key={key} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className={cfg.text}>{cfg.icon}</span>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ui-muted">{t(cfg.sectionKey)}</h4>
                            <span className="text-[10px] bg-ui-surface2 px-1.5 rounded-full text-ui-muted font-bold">{items.length}</span>
                            {showAdd && (
                                <button onClick={() => onAdd(key)} className="ml-auto text-[10px] font-bold text-ui-muted hover:text-ui-text">
                                    + {t(cfg.addKey)}
                                </button>
                            )}
                        </div>
                        {items.length === 0 ? (
                            <p className="text-[11px] text-ui-muted italic px-1">{t('sessionItem.empty')}</p>
                        ) : (
                            items.map((item) => (
                                <SessionItemRow
                                    key={item.id}
                                    item={item}
                                    onToggle={() => onToggle(item)}
                                    onEdit={() => onEdit(item)}
                                    onRemove={() => onRemove(item)}
                                />
                            ))
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default SessionItemSections
