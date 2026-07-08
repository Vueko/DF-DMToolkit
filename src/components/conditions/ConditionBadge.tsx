import { useMemo, useState } from 'react'
import type { ConditionInstance } from '../../types'
import { conditionLabel } from '../../types'
import { useSrd } from '../../srd/useSrd'
import { useT } from '../../i18n'

interface SrdCondition { name?: string; desc?: string }

interface ConditionBadgeProps {
    condition: ConditionInstance
    onUpdate?: (updates: Partial<ConditionInstance>) => void
    onRemove?: () => void
}

export function ConditionBadge({ condition, onUpdate, onRemove }: ConditionBadgeProps) {
    const t = useT()
    // Posición fija calculada al abrir: el popover escapa de contenedores con scroll/overflow.
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const open = pos !== null
    const setOpen = (v: boolean) => { if (!v) setPos(null) }
    const { data } = useSrd<SrdCondition[]>('conditions')

    const rules = useMemo(
        () => (data ?? []).find((c) => c.name?.toLowerCase() === condition.conditionId)?.desc ?? null,
        [data, condition.conditionId],
    )

    const expired = condition.roundsLeft === 0
    const label = conditionLabel(condition.conditionId)
        + (condition.conditionId === 'exhaustion' && condition.level ? ` ${condition.level}` : '')
        + (condition.roundsLeft !== undefined ? ` · ${condition.roundsLeft}r` : '')

    const toggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (open) return setPos(null)
        const r = e.currentTarget.getBoundingClientRect()
        setPos({
            top: Math.min(r.bottom + 4, window.innerHeight - 280),
            left: Math.min(r.left, window.innerWidth - 310),
        })
    }

    return (
        <span className="relative inline-flex">
            <button
                onClick={toggle}
                className={`text-[11px] font-bold px-2 py-0.5 rounded border transition-colors ${
                    expired
                        ? 'text-danger-yellow border-danger-yellow/50 bg-danger-yellow/10'
                        : 'text-arcane-light border-arcane-light/40 bg-arcane-light/10 hover:bg-arcane-light/20'
                }`}
                title={condition.source}
            >
                {label}
            </button>
            {open && pos && (
                <>
                    <span className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <span className="fixed z-50 w-72 bg-ui-surface border border-ui-surface2 rounded-xl shadow-2xl p-3 flex flex-col gap-2 text-left" style={{ top: pos.top, left: pos.left }}>
                        <span className="flex items-center justify-between gap-2">
                            <span className="text-ui-text text-sm font-bold">{conditionLabel(condition.conditionId)}</span>
                            {onRemove && (
                                <button
                                    onClick={() => { setOpen(false); onRemove() }}
                                    className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase"
                                >
                                    {t('conditions.remove')}
                                </button>
                            )}
                        </span>
                        {condition.source && <span className="text-ui-muted text-[11px] italic">{condition.source}</span>}
                        {onUpdate && (
                            <span className="flex items-center gap-3 flex-wrap">
                                {condition.conditionId === 'exhaustion' && (
                                    <span className="flex items-center gap-1 text-[11px] text-ui-muted">
                                        {t('conditions.level')}
                                        <button onClick={() => onUpdate({ level: Math.max(1, (condition.level ?? 1) - 1) as ConditionInstance['level'] })} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text font-bold">−</button>
                                        <span className="text-ui-text font-bold w-4 text-center">{condition.level ?? 1}</span>
                                        <button onClick={() => onUpdate({ level: Math.min(6, (condition.level ?? 1) + 1) as ConditionInstance['level'] })} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text font-bold">+</button>
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-[11px] text-ui-muted">
                                    {t('conditions.rounds')}
                                    <button onClick={() => onUpdate({ roundsLeft: Math.max(0, (condition.roundsLeft ?? 1) - 1) })} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text font-bold">−</button>
                                    <span className="text-ui-text font-bold w-4 text-center">{condition.roundsLeft ?? '∞'}</span>
                                    <button onClick={() => onUpdate({ roundsLeft: (condition.roundsLeft ?? 0) + 1 })} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text font-bold">+</button>
                                </span>
                            </span>
                        )}
                        <span className="text-ui-muted text-[11px] leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                            {rules ?? t('conditions.noRules')}
                        </span>
                    </span>
                </>
            )}
        </span>
    )
}
