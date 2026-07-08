import { useState } from 'react'
import type { Monster, MonsterAbility, MonsterStats } from '../../types'
import { Button, Input, Textarea } from '../ui'
import { useT } from '../../i18n'

interface MonsterEditorProps {
    initial: Monster
    title: string
    onSave: (monster: Monster) => void
    onCancel: () => void
}

type AbilitySectionKey = 'passives' | 'actions' | 'bonusActions' | 'reactions' | 'legendaryActions' | 'lairActions'

const ABILITY_SECTIONS: { key: AbilitySectionKey; label: string }[] = [
    { key: 'passives', label: 'bestiary.editor.sectionTraits' },
    { key: 'actions', label: 'bestiary.editor.sectionActions' },
    { key: 'bonusActions', label: 'bestiary.editor.sectionBonusActions' },
    { key: 'reactions', label: 'bestiary.editor.sectionReactions' },
    { key: 'legendaryActions', label: 'bestiary.editor.sectionLegendaryActions' },
    { key: 'lairActions', label: 'bestiary.editor.sectionLairActions' },
]

const STAT_KEYS: (keyof MonsterStats)[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

// Campos de texto opcionales del statblock: string vacío ↔ undefined.
const TEXT_FIELDS: { key: 'acNote' | 'saves' | 'skills' | 'senses' | 'languages' | 'vulnerabilities' | 'resistances' | 'immunities' | 'conditionImmunities'; label: string }[] = [
    { key: 'acNote', label: 'bestiary.editor.acNote' },
    { key: 'saves', label: 'bestiary.editor.saves' },
    { key: 'skills', label: 'bestiary.editor.skills' },
    { key: 'senses', label: 'bestiary.editor.senses' },
    { key: 'languages', label: 'bestiary.editor.languages' },
    { key: 'vulnerabilities', label: 'bestiary.editor.vulnerabilities' },
    { key: 'resistances', label: 'bestiary.editor.resistances' },
    { key: 'immunities', label: 'bestiary.editor.immunities' },
    { key: 'conditionImmunities', label: 'bestiary.editor.conditionImmunities' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{label}</label>
            {children}
        </div>
    )
}

export function MonsterEditor({ initial, title, onSave, onCancel }: MonsterEditorProps) {
    const t = useT()
    const [m, setM] = useState<Monster>(initial)

    const set = (updates: Partial<Monster>) => setM((prev) => ({ ...prev, ...updates }))
    const setText = (key: (typeof TEXT_FIELDS)[number]['key'], value: string) =>
        set({ [key]: value.trim() === '' ? undefined : value } as Partial<Monster>)

    const setAbility = (section: AbilitySectionKey, id: string, updates: Partial<MonsterAbility>) =>
        setM((prev) => ({
            ...prev,
            [section]: (prev[section] ?? []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }))
    const addAbility = (section: AbilitySectionKey) =>
        setM((prev) => ({
            ...prev,
            [section]: [...(prev[section] ?? []), { id: `hb-ability:${crypto.randomUUID()}`, name: '', description: '' }],
        }))
    const removeAbility = (section: AbilitySectionKey, id: string) =>
        setM((prev) => ({ ...prev, [section]: (prev[section] ?? []).filter((a) => a.id !== id) }))

    const handleSave = () => {
        if (!m.name.trim()) return
        // Normaliza: usage vacío fuera, lairActions vacío → undefined.
        const clean = (list: MonsterAbility[] = []): MonsterAbility[] =>
            list.map((a) => ({ ...a, usage: a.usage?.trim() ? a.usage : undefined }))
        onSave({
            ...m,
            name: m.name.trim(),
            passives: clean(m.passives),
            actions: clean(m.actions),
            bonusActions: clean(m.bonusActions),
            reactions: clean(m.reactions),
            legendaryActions: clean(m.legendaryActions),
            lairActions: (m.lairActions ?? []).length > 0 ? clean(m.lairActions) : undefined,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
            <div className="bg-ui-surface w-full max-w-5xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh] modal-enter">

                <div className="flex items-center justify-between p-5 border-b border-ui-surface2">
                    <h2 className="text-lg font-display font-semibold text-ui-text">{title}</h2>
                    <Button variant="ghost" size="sm" onClick={onCancel}>✕</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

                    {/* Identidad */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                            <Field label={t('bestiary.editor.name')}>
                                <Input value={m.name} onChange={(e) => set({ name: e.target.value })} />
                            </Field>
                        </div>
                        <Field label={t('bestiary.editor.size')}>
                            <Input value={m.size} onChange={(e) => set({ size: e.target.value })} />
                        </Field>
                        <Field label={t('bestiary.editor.type')}>
                            <Input value={m.type} onChange={(e) => set({ type: e.target.value })} />
                        </Field>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-2">
                            <Field label={t('bestiary.editor.alignment')}>
                                <Input value={m.alignment} onChange={(e) => set({ alignment: e.target.value })} />
                            </Field>
                        </div>
                        <Field label={t('bestiary.editor.cr')}>
                            <Input type="number" min={0} step="any" value={m.cr} onChange={(e) => set({ cr: Math.max(0, +e.target.value || 0) })} />
                        </Field>
                        <Field label={t('bestiary.editor.xp')}>
                            <Input type="number" min={0} value={m.xp} onChange={(e) => set({ xp: Math.max(0, Math.round(+e.target.value || 0)) })} />
                        </Field>
                    </div>

                    {/* Defensas */}
                    <div className="grid grid-cols-5 gap-3">
                        <Field label={t('bestiary.editor.ac')}>
                            <Input type="number" min={1} value={m.ac} onChange={(e) => set({ ac: Math.max(1, Math.round(+e.target.value || 10)) })} />
                        </Field>
                        <Field label={t('bestiary.editor.hpAverage')}>
                            <Input type="number" min={1} value={m.hp.average} onChange={(e) => set({ hp: { ...m.hp, average: Math.max(1, Math.round(+e.target.value || 1)) } })} />
                        </Field>
                        <Field label={t('bestiary.editor.hpFormula')}>
                            <Input value={m.hp.formula ?? ''} onChange={(e) => set({ hp: { ...m.hp, formula: e.target.value.trim() === '' ? undefined : e.target.value } })} />
                        </Field>
                        <div className="col-span-2">
                            <Field label={t('bestiary.editor.speed')}>
                                <Input value={m.speed} onChange={(e) => set({ speed: e.target.value })} />
                            </Field>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-6 gap-3">
                        {STAT_KEYS.map((k) => (
                            <Field key={k} label={k.toUpperCase()}>
                                <Input
                                    type="number" min={1} max={30}
                                    value={m.stats[k]}
                                    onChange={(e) => set({ stats: { ...m.stats, [k]: Math.min(30, Math.max(1, Math.round(+e.target.value || 10))) } })}
                                />
                            </Field>
                        ))}
                    </div>

                    {/* Texto opcional */}
                    <div className="grid grid-cols-3 gap-3">
                        {TEXT_FIELDS.map(({ key, label }) => (
                            <Field key={key} label={t(label)}>
                                <Input value={m[key] ?? ''} onChange={(e) => setText(key, e.target.value)} />
                            </Field>
                        ))}
                    </div>

                    <Field label={t('bestiary.editor.legendaryResistance')}>
                        <div className="w-40">
                            <Input
                                type="number" min={1}
                                value={m.legendaryResistance ?? ''}
                                onChange={(e) => set({ legendaryResistance: e.target.value === '' ? undefined : Math.max(1, Math.round(+e.target.value || 1)) })}
                            />
                        </div>
                    </Field>

                    {/* Secciones de habilidades */}
                    {ABILITY_SECTIONS.map(({ key, label }) => (
                        <div key={key} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between border-b border-ui-surface2 pb-1">
                                <span className="text-xs font-bold text-ui-text uppercase tracking-wider">{t(label)}</span>
                                <Button variant="ghost" size="sm" onClick={() => addAbility(key)}>{t('bestiary.editor.addAbility')}</Button>
                            </div>
                            {(m[key] ?? []).map((a) => (
                                <div key={a.id} className="bg-ui-bg/40 rounded-lg p-3 flex flex-col gap-2">
                                    <div className="grid grid-cols-5 gap-2">
                                        <div className="col-span-2">
                                            <Input placeholder={t('bestiary.editor.abilityName')} value={a.name} onChange={(e) => setAbility(key, a.id, { name: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <Input placeholder={t('bestiary.editor.abilityUsage')} value={a.usage ?? ''} onChange={(e) => setAbility(key, a.id, { usage: e.target.value })} />
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => removeAbility(key, a.id)}>{t('bestiary.editor.removeAbility')}</Button>
                                    </div>
                                    <Textarea rows={2} placeholder={t('bestiary.editor.abilityDesc')} value={a.description} onChange={(e) => setAbility(key, a.id, { description: e.target.value })} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="p-5 border-t border-ui-surface2 flex justify-end gap-3 bg-ui-surface/50 rounded-b-2xl">
                    <Button variant="ghost" onClick={onCancel}>{t('bestiary.editor.cancel')}</Button>
                    <Button variant="primary" onClick={handleSave} disabled={!m.name.trim()}>{t('bestiary.editor.save')}</Button>
                </div>
            </div>
        </div>
    )
}
