import { useRef, useState } from 'react'
import type { Monster, MonsterAbility } from '../../types'
import { crLabel, abilityMod, fmtMod } from '../../utils/monster'
import { renderBold } from '../../utils/renderBold'
import { segmentDiceText, segmentBonusText } from '../../dice/statblockDice'
import { critNotation } from '../../dice/roll'
import { useDiceStore } from '../../store/diceStore'
import { useT } from '../../i18n'

// Reproduce/detiene el soundClip del monstruo en streaming; si la carga falla, desaparece.
function SoundButton({ url }: { url: string }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [playing, setPlaying] = useState(false)
    const [failed, setFailed] = useState(false)
    const toggle = () => {
        if (playing) { audioRef.current?.pause(); setPlaying(false); return }
        if (!audioRef.current) {
            const a = new Audio(url)
            a.onended = () => setPlaying(false)
            a.onerror = () => { setFailed(true); setPlaying(false) }
            audioRef.current = a
        }
        audioRef.current.currentTime = 0
        audioRef.current.play().then(() => setPlaying(true)).catch(() => setFailed(true))
    }
    if (failed) return null
    return (
        <button
            onClick={toggle}
            aria-label={playing ? 'Stop sound' : 'Play sound'}
            className="shrink-0 text-card-text/60 hover:text-card-text transition-colors text-xs leading-none"
        >
            {playing ? '■' : '▶'}
        </button>
    )
}

const STATS: { key: keyof Monster['stats']; label: string }[] = [
    { key: 'str', label: 'STR' }, { key: 'dex', label: 'DEX' }, { key: 'con', label: 'CON' },
    { key: 'int', label: 'INT' }, { key: 'wis', label: 'WIS' }, { key: 'cha', label: 'CHA' },
]

function InfoLine({ label, value }: { label: string; value?: string }) {
    if (!value) return null
    return (
        <p className="text-[11px] leading-snug text-card-text">
            <span className="font-bold">{label}</span> {value}
        </p>
    )
}

const ROLL_SPAN_CLASS = 'underline decoration-dotted underline-offset-2 hover:text-arcane-light transition-colors cursor-pointer'

// Notación de un d20 con modificador; evita "1d20+0" y "1d20+-2".
const d20Notation = (mod: number): string => (mod === 0 ? '1d20' : mod > 0 ? `1d20+${mod}` : `1d20${mod}`)

// Texto de habilidad con las tiradas clicables. Shift+clic en daño = crítico (dados x2).
function DiceText({ text, label }: { text: string; label: string }) {
    const t = useT()
    return (
        <>
            {segmentDiceText(text).map((seg, i) =>
                seg.kind === 'text' ? (
                    <span key={i}>{renderBold(seg.text)}</span>
                ) : (
                    <button
                        key={i}
                        type="button"
                        className={ROLL_SPAN_CLASS}
                        onClick={(e) => {
                            const isCrit = seg.rollKind === 'damage' && e.shiftKey
                            const notation = isCrit ? (critNotation(seg.notation) ?? seg.notation) : seg.notation
                            const kind = t(seg.rollKind === 'attack' ? 'dice.toHit' : 'dice.damage')
                            useDiceStore.getState().rollNotation(notation, {
                                label: `${label} (${kind}${isCrit ? `, ${t('dice.crit')}` : ''})`,
                            })
                        }}
                    >
                        {seg.text}
                    </button>
                ))}
        </>
    )
}

// Línea de saves/skills: cada par nombre/bono clicable, conservando el texto intermedio
// (comas, notas como "(while raging)"). Sin pares parseables cae a InfoLine.
function BonusLine({ label, value, monsterName, suffixKey }: {
    label: string; value?: string; monsterName: string; suffixKey: string
}) {
    const t = useT()
    if (!value) return null
    const segments = segmentBonusText(value)
    if (!segments.some((s) => s.kind === 'bonus')) return <InfoLine label={label} value={value} />
    return (
        <p className="text-[11px] leading-snug text-card-text">
            <span className="font-bold">{label}</span>{' '}
            {segments.map((seg, i) =>
                seg.kind === 'text' ? (
                    <span key={i}>{seg.text}</span>
                ) : (
                    <button
                        key={i}
                        type="button"
                        className={ROLL_SPAN_CLASS}
                        onClick={() => useDiceStore.getState().rollNotation(
                            d20Notation(seg.bonus),
                            { label: `${monsterName} · ${seg.name} ${t(suffixKey)}` },
                        )}
                    >
                        {seg.text}
                    </button>
                ))}
        </p>
    )
}

function AbilitySection({ title, note, items, monsterName }: {
    title: string; note?: string; items: MonsterAbility[]; monsterName: string
}) {
    if (items.length === 0) return null
    return (
        <div className="px-4 pb-2">
            <p className="text-card-text font-black text-[10px] uppercase tracking-widest border-b border-card-border/60 pb-0.5 mb-1.5">
                {title}{note ? <span className="normal-case font-semibold tracking-normal"> — {note}</span> : null}
            </p>
            <div className="flex flex-col gap-1.5">
                {items.map((a) => (
                    <p key={a.id} className="text-[11px] leading-snug text-card-text/90">
                        <span className="font-black italic">{a.name}{a.usage ? ` (${a.usage})` : ''}.</span>{' '}
                        <DiceText text={a.description} label={`${monsterName} · ${a.name}`} />
                    </p>
                ))}
            </div>
        </div>
    )
}

export function MonsterCard({ monster }: { monster: Monster }) {
    const m = monster
    const t = useT()
    return (
        <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden font-serif">
            {/* Cabecera */}
            <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-card-text font-display text-lg font-black uppercase tracking-wide leading-tight">{m.name}</h3>
                    {m.soundClipUrl ? <SoundButton url={m.soundClipUrl} /> : null}
                </div>
                <p className="text-card-text/65 text-[11px] italic">
                    {[m.size, m.type].filter(Boolean).join(' ')}{m.alignment ? `, ${m.alignment}` : ''}
                </p>
            </div>

            {/* Defensas */}
            <div className="mx-4 my-2 border border-card-border/70 rounded-lg px-3 py-2 flex flex-col gap-0.5">
                <InfoLine label="AC" value={`${m.ac}${m.acNote ? ` (${m.acNote})` : ''}`} />
                <InfoLine label="HP" value={`${m.hp.average}${m.hp.formula ? ` (${m.hp.formula})` : ''}`} />
                <InfoLine label="Speed" value={m.speed} />
                <InfoLine label="Initiative" value={m.initiativeBonus !== undefined ? `${fmtMod(m.initiativeBonus)} (${10 + m.initiativeBonus})` : undefined} />
            </div>

            {/* Stats — clic = prueba de característica (d20 + mod) */}
            <div className="mx-4 my-2 grid grid-cols-6 border border-card-border/70 rounded-lg overflow-hidden text-center">
                {STATS.map(({ key, label }) => {
                    const mod = abilityMod(m.stats[key])
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => useDiceStore.getState().rollNotation(
                                d20Notation(mod),
                                { label: `${m.name} · ${label} ${t('dice.check')}` },
                            )}
                            className="py-1.5 border-r last:border-r-0 border-card-border/40 hover:bg-card-border/20 transition-colors"
                        >
                            <p className="text-[9px] font-black text-card-text/60 uppercase">{label}</p>
                            <p className="text-xs font-bold text-card-text tabular-nums">{m.stats[key]}</p>
                            <p className="text-[10px] text-card-text/70 tabular-nums">{fmtMod(mod)}</p>
                        </button>
                    )
                })}
            </div>

            {/* Rasgos derivados */}
            <div className="px-4 pb-2 flex flex-col gap-0.5">
                <BonusLine label="Saves" value={m.saves} monsterName={m.name} suffixKey="dice.save" />
                <BonusLine label="Skills" value={m.skills} monsterName={m.name} suffixKey="dice.check" />
                <InfoLine label="Vulnerabilities" value={m.vulnerabilities} />
                <InfoLine label="Resistances" value={m.resistances} />
                <InfoLine label="Immunities" value={m.immunities} />
                <InfoLine label="Condition Immunities" value={m.conditionImmunities} />
                <InfoLine label="Senses" value={m.senses} />
                <InfoLine label="Languages" value={m.languages} />
                <InfoLine label="CR" value={`${crLabel(m.cr)} (XP ${m.xp.toLocaleString('en-US')})`} />
            </div>

            <AbilitySection title="Traits" items={m.passives} monsterName={m.name} />
            <AbilitySection title="Actions" items={m.actions} monsterName={m.name} />
            <AbilitySection title="Bonus Actions" items={m.bonusActions} monsterName={m.name} />
            <AbilitySection title="Reactions" items={m.reactions} monsterName={m.name} />
            <AbilitySection
                title="Legendary Actions"
                note={m.legendaryResistance !== undefined ? `Legendary Resistance ${m.legendaryResistance}/Day` : undefined}
                items={m.legendaryActions}
                monsterName={m.name}
            />
            <AbilitySection title="Lair Actions" items={m.lairActions ?? []} monsterName={m.name} />
            <div className="pb-2" />
        </div>
    )
}
