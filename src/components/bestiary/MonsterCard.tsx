import type { Monster, MonsterAbility } from '../../types'
import { crLabel, abilityMod, fmtMod } from '../../utils/monster'
import { renderBold } from '../../utils/renderBold'

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

function AbilitySection({ title, note, items }: { title: string; note?: string; items: MonsterAbility[] }) {
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
                        {renderBold(a.description)}
                    </p>
                ))}
            </div>
        </div>
    )
}

export function MonsterCard({ monster }: { monster: Monster }) {
    const m = monster
    return (
        <div className="bg-card-bg rounded-xl border border-card-border overflow-hidden font-serif">
            {/* Cabecera */}
            <div className="px-4 pt-3 pb-1">
                <h3 className="text-card-text font-display text-lg font-black uppercase tracking-wide leading-tight">{m.name}</h3>
                <p className="text-card-text/65 text-[11px] italic">
                    {[m.size, m.type].filter(Boolean).join(' ')}{m.alignment ? `, ${m.alignment}` : ''}
                </p>
            </div>

            {/* Defensas */}
            <div className="mx-4 my-2 border border-card-border/70 rounded-lg px-3 py-2 flex flex-col gap-0.5">
                <InfoLine label="AC" value={`${m.ac}${m.acNote ? ` (${m.acNote})` : ''}`} />
                <InfoLine label="HP" value={`${m.hp.average}${m.hp.formula ? ` (${m.hp.formula})` : ''}`} />
                <InfoLine label="Speed" value={m.speed} />
            </div>

            {/* Stats */}
            <div className="mx-4 my-2 grid grid-cols-6 border border-card-border/70 rounded-lg overflow-hidden text-center">
                {STATS.map(({ key, label }) => (
                    <div key={key} className="py-1.5 border-r last:border-r-0 border-card-border/40">
                        <p className="text-[9px] font-black text-card-text/60 uppercase">{label}</p>
                        <p className="text-xs font-bold text-card-text tabular-nums">{m.stats[key]}</p>
                        <p className="text-[10px] text-card-text/70 tabular-nums">{fmtMod(abilityMod(m.stats[key]))}</p>
                    </div>
                ))}
            </div>

            {/* Rasgos derivados */}
            <div className="px-4 pb-2 flex flex-col gap-0.5">
                <InfoLine label="Saves" value={m.saves} />
                <InfoLine label="Skills" value={m.skills} />
                <InfoLine label="Vulnerabilities" value={m.vulnerabilities} />
                <InfoLine label="Resistances" value={m.resistances} />
                <InfoLine label="Immunities" value={m.immunities} />
                <InfoLine label="Condition Immunities" value={m.conditionImmunities} />
                <InfoLine label="Senses" value={m.senses} />
                <InfoLine label="Languages" value={m.languages} />
                <InfoLine label="CR" value={`${crLabel(m.cr)} (XP ${m.xp.toLocaleString('en-US')})`} />
            </div>

            <AbilitySection title="Traits" items={m.passives} />
            <AbilitySection title="Actions" items={m.actions} />
            <AbilitySection title="Bonus Actions" items={m.bonusActions} />
            <AbilitySection title="Reactions" items={m.reactions} />
            <AbilitySection
                title="Legendary Actions"
                note={m.legendaryResistance !== undefined ? `Legendary Resistance ${m.legendaryResistance}/Day` : undefined}
                items={m.legendaryActions}
            />
            <AbilitySection title="Lair Actions" items={m.lairActions ?? []} />
            <div className="pb-2" />
        </div>
    )
}
