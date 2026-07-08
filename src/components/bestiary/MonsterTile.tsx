import type { Monster } from '../../types'
import { crLabel } from '../../utils/monster'
import { useT } from '../../i18n'

interface MonsterTileProps {
    monster: Monster
    onClick?: () => void
    onViewDetails?: () => void   // muestra el botón "Ver statblock" si se pasa
    badge?: string               // p. ej. "×3"
}

// Card parchment compacta para grids de biblioteca (Bestiario y Encounters).
export function MonsterTile({ monster, onClick, onViewDetails, badge }: MonsterTileProps) {
    const t = useT()
    const m = monster
    const actionNames = m.actions.slice(0, 3).map((a) => a.name).join(' · ')

    return (
        <div
            onClick={onClick}
            className="bg-card-bg rounded-xl border border-card-border p-3 font-serif text-left transition-colors hover:border-danger-primary/50 cursor-pointer flex flex-col gap-1"
        >
            <div className="flex items-start justify-between gap-1">
                <h3 className="text-card-text font-display text-sm font-black uppercase tracking-wide leading-tight min-w-0">
                    {m.name}
                </h3>
                <span className="flex items-center gap-1 shrink-0">
                    {m.source === 'homebrew' && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-arcane-secondary bg-arcane-secondary/10 px-1 py-0.5 rounded">HB</span>
                    )}
                    {badge && <span className="text-danger-primary font-bold text-xs">{badge}</span>}
                </span>
            </div>
            <p className="text-card-text/65 text-[11px] italic leading-tight">
                CR {crLabel(m.cr)} · {m.type}{m.size ? ` · ${m.size}` : ''}
            </p>
            <p className="text-card-text text-[11px]">
                <span className="font-bold">AC</span> {m.ac} · <span className="font-bold">HP</span> {m.hp.average} · {m.speed}
            </p>
            <p className="text-card-text/80 text-[10px] font-bold">{m.xp.toLocaleString('en-US')} XP</p>
            {actionNames && (
                <p className="text-card-text/70 text-[10px] line-clamp-1">{actionNames}</p>
            )}
            {onViewDetails && (
                <button
                    onClick={(e) => { e.stopPropagation(); onViewDetails() }}
                    className="mt-1 w-full py-1 rounded-lg bg-card-border/30 hover:bg-danger-primary/15 text-card-text/60 hover:text-card-text text-[10px] font-semibold transition-colors border border-card-border/40"
                >
                    {t('bestiary.viewStatblock')}
                </button>
            )}
        </div>
    )
}
