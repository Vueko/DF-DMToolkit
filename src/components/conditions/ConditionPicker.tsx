import { useState } from 'react'
import type { ConditionInstance } from '../../types'
import { CONDITION_IDS, conditionLabel } from '../../types'
import { useT } from '../../i18n'

interface ConditionPickerProps {
    onAdd: (condition: ConditionInstance) => void
    /** Condiciones ya aplicadas, para no ofrecerlas dos veces (exhaustion se gestiona por nivel). */
    applied?: ConditionInstance[]
}

export function ConditionPicker({ onAdd, applied = [] }: ConditionPickerProps) {
    const t = useT()
    // Posición fija calculada al abrir: el desplegable escapa de contenedores con scroll/overflow.
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const open = pos !== null
    const setOpen = (v: boolean) => { if (!v) setPos(null) }
    const appliedIds = new Set(applied.map((c) => c.conditionId))
    const available = CONDITION_IDS.filter((id) => !appliedIds.has(id))

    const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (open) return setPos(null)
        const r = e.currentTarget.getBoundingClientRect()
        setPos({
            top: Math.min(r.bottom + 4, window.innerHeight - 260),
            left: Math.min(r.left, window.innerWidth - 190),
        })
    }

    return (
        <span className="relative inline-flex">
            <button
                onClick={toggle}
                className="text-[11px] font-bold px-2 py-0.5 rounded border border-ui-surface2 text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors"
                title={t('conditions.add')}
            >
                +
            </button>
            {open && pos && (
                <>
                    <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <span className="fixed z-50 w-44 max-h-60 overflow-y-auto bg-ui-surface border border-ui-surface2 rounded-xl shadow-2xl py-1 flex flex-col" style={{ top: pos.top, left: pos.left }}>
                        {available.length === 0 && (
                            <span className="px-3 py-2 text-[11px] text-ui-muted">{t('conditions.allApplied')}</span>
                        )}
                        {available.map((id) => (
                            <button
                                key={id}
                                onClick={() => {
                                    onAdd(id === 'exhaustion' ? { conditionId: id, level: 1 } : { conditionId: id })
                                    setOpen(false)
                                }}
                                className="text-left px-3 py-1.5 text-sm text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors"
                            >
                                {conditionLabel(id)}
                            </button>
                        ))}
                    </span>
                </>
            )}
        </span>
    )
}
