import { useState } from 'react'
import { isBloodied } from '../../utils/combat'
import { useT } from '../../i18n'

interface HpTrackerProps {
    current: number
    max: number
    temp?: number
    onApply: (delta: number) => void      // negativo = daño, positivo = curación
    onSetTemp?: (temp: number) => void
    compact?: boolean                     // versión mini para chips
}

// Tracker de vida: control segmentado [− cantidad +] discreto, barra con el
// número centrado, y THP aparte. Los acentos usan tintes suaves del sistema.
export function HpTracker({ current, max, temp = 0, onApply, onSetTemp, compact = false }: HpTrackerProps) {
    const t = useT()
    const [amount, setAmount] = useState(1)
    const dead = current === 0 && temp === 0
    const bloodied = isBloodied(current, max)
    const pct = Math.min(100, (current / Math.max(1, max)) * 100)

    const barHeight = compact ? 'h-4' : 'h-5'
    const numSize = compact ? 'text-[11px]' : 'text-xs'

    return (
        <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Control segmentado − cantidad + */}
            <div className="flex items-stretch rounded-lg border border-ui-surface2 overflow-hidden shrink-0 bg-ui-bg">
                <button
                    onClick={() => onApply(-amount)}
                    className="w-6 h-6 bg-danger-primary/10 text-danger-primary hover:bg-danger-primary/25 text-sm font-black flex items-center justify-center transition-colors"
                    title={t('combat.damage')}
                >−</button>
                <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Math.round(+e.target.value || 1)))}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="w-9 h-6 bg-transparent border-x border-ui-surface2 text-ui-text text-center text-xs font-bold tabular-nums outline-none"
                    title={t('combat.amount')}
                />
                <button
                    onClick={() => onApply(+amount)}
                    className="w-6 h-6 bg-green-600/10 text-green-600 hover:bg-green-600/25 text-sm font-black flex items-center justify-center transition-colors"
                    title={t('combat.heal')}
                >+</button>
            </div>

            {/* Barra con número centrado */}
            <div className={`relative flex-1 min-w-20 ${barHeight} bg-ui-surface2/60 rounded-full overflow-hidden`}>
                <div
                    className={`h-full transition-all ${dead ? 'bg-red-700' : bloodied ? 'bg-danger-secondary' : 'bg-danger-primary/80'}`}
                    style={{ width: `${pct}%` }}
                />
                <span className={`absolute inset-0 flex items-center justify-center ${numSize} font-bold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]`}>
                    {bloodied ? '🩸 ' : ''}{current}/{max}{temp > 0 ? ` +${temp}` : ''}
                </span>
            </div>

            {/* THP separado */}
            {onSetTemp && (
                <label className="shrink-0 flex items-center gap-1" title={t('combat.tempHp')}>
                    <span className="text-[9px] font-bold text-arcane-secondary uppercase tracking-wide">THP</span>
                    <input
                        type="number"
                        min={0}
                        value={temp || ''}
                        placeholder="0"
                        onChange={(e) => onSetTemp(Math.max(0, Math.round(+e.target.value || 0)))}
                        className="w-9 h-6 rounded-lg bg-ui-bg border border-ui-surface2 text-arcane-secondary text-center text-xs font-bold tabular-nums outline-none focus:border-arcane-secondary"
                    />
                </label>
            )}
        </div>
    )
}
