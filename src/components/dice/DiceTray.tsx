// src/components/dice/DiceTray.tsx
import { useState } from 'react'
import { useDiceStore } from '../../store/diceStore'
import { D20Icon } from '../icons'
import { useT } from '../../i18n'
import type { RollMode, RollResult } from '../../dice/roll'

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100]
const MODES: { mode: RollMode; key: string }[] = [
    { mode: 'normal', key: 'dice.modeNormal' },
    { mode: 'advantage', key: 'dice.modeAdvantage' },
    { mode: 'disadvantage', key: 'dice.modeDisadvantage' },
]

const totalClass = (r: RollResult) =>
    r.d20?.crit === 20 ? 'text-danger-gold' : r.d20?.crit === 1 ? 'text-red-500' : 'text-ui-text'

// Cada dado como un chip (descartados tachados) + los modificadores, para ver la tirada completa.
function DiceChips({ result }: { result: RollResult }) {
    return (
        <div className="flex items-center gap-1 flex-wrap">
            {result.terms.map((term, i) => (
                <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-ui-muted text-[10px]">{term.subtotal < 0 ? '−' : '+'}</span>}
                    {term.rolls.length === 0 ? (
                        <span className="text-ui-muted text-[11px] tabular-nums">{Math.abs(term.subtotal)}</span>
                    ) : (
                        term.rolls.map((v, j) => (
                            <span
                                key={j}
                                className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded text-[10px] font-bold tabular-nums border ${
                                    term.kept[j]
                                        ? 'bg-ui-surface2 border-ui-surface2 text-ui-text'
                                        : 'border-transparent text-ui-muted/40 line-through'
                                }`}
                            >
                                {v}
                            </span>
                        ))
                    )}
                </span>
            ))}
        </div>
    )
}

function DiceTray() {
    const t = useT()
    const { history, trayOpen, mode, rollNotation, clearHistory, setTrayOpen, setMode } = useDiceStore()
    const [input, setInput] = useState('')
    const [invalid, setInvalid] = useState(false)
    const latest = history[0]

    const rollInput = () => {
        if (!input.trim()) return
        const result = rollNotation(input)
        setInvalid(result === null)
        if (result) setInput('')
    }

    return (
        <div className="relative shrink-0">
            {trayOpen && (
                <div className="absolute bottom-full right-0 mb-2 z-50 w-96 bg-ui-surface border border-ui-surface2 rounded-xl shadow-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-display font-bold text-ui-text">{t('dice.title')}</p>
                        <div className="flex gap-0.5 bg-ui-surface2/60 rounded-lg p-0.5">
                            {MODES.map(({ mode: m, key }) => (
                                <button key={m} onClick={() => setMode(m)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-colors ${
                                        m === mode ? 'bg-arcane-light/20 text-arcane-light' : 'text-ui-muted hover:text-ui-text'
                                    }`}>
                                    {t(key)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {QUICK_DICE.map((sides) => (
                            <button key={sides} onClick={() => rollNotation(`1d${sides}`)}
                                className="py-1.5 rounded-lg border border-ui-surface2 text-xs font-medium text-ui-muted hover:text-ui-text hover:border-arcane-light transition-colors">
                                d{sides}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setInvalid(false) }}
                            onKeyDown={(e) => e.key === 'Enter' && rollInput()}
                            placeholder={t('dice.notationPlaceholder')}
                            className={`flex-1 bg-ui-surface2/60 border rounded-lg px-3 py-1.5 text-xs text-ui-text outline-none transition-colors ${
                                invalid ? 'border-red-500' : 'border-ui-surface2 focus:border-arcane-light'
                            }`}
                        />
                        <button onClick={rollInput}
                            className="text-xs bg-arcane-light hover:bg-arcane-secondary text-ui-text px-3 py-1.5 rounded-lg transition-colors font-medium">
                            {t('dice.roll')}
                        </button>
                    </div>
                    {invalid && <p className="text-[10px] text-red-500">{t('dice.invalid')}</p>}

                    {latest && (
                        <div className="flex items-center gap-3 border-t border-ui-surface2 pt-3">
                            <span className={`font-display font-bold text-3xl tabular-nums ${totalClass(latest)}`}>{latest.total}</span>
                            <div className="flex flex-col min-w-0 gap-1">
                                <span className="text-[11px] text-ui-text truncate">{latest.label ?? latest.notation}</span>
                                <DiceChips result={latest} />
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto border-t border-ui-surface2 pt-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('dice.history')}</p>
                            {history.length > 0 && (
                                <button onClick={clearHistory} className="text-[10px] text-ui-muted hover:text-ui-text transition-colors">
                                    {t('dice.clear')}
                                </button>
                            )}
                        </div>
                        {history.length === 0 && <p className="text-[11px] text-ui-muted">{t('dice.empty')}</p>}
                        {history.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 rounded-lg bg-ui-surface2/30 px-2 py-1.5">
                                <span className={`font-bold text-lg tabular-nums w-9 text-right shrink-0 ${totalClass(r)}`}>{r.total}</span>
                                <div className="flex flex-col min-w-0 gap-0.5 flex-1">
                                    <span className="text-[11px] text-ui-text truncate">{r.label ?? r.notation}</span>
                                    <DiceChips result={r} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => setTrayOpen(!trayOpen)}
                title={t('dice.openTray')}
                className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1 transition-colors ${
                    trayOpen ? 'bg-arcane-light/15 border-arcane-light text-arcane-light' : 'bg-ui-surface2/60 border-ui-surface2 hover:border-arcane-light text-ui-text'
                }`}
            >
                <D20Icon className="w-4 h-4" />
                {latest && !trayOpen && (
                    <span className={`text-xs font-bold tabular-nums ${totalClass(latest)}`}>{latest.total}</span>
                )}
            </button>
        </div>
    )
}

export default DiceTray
