import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Encounter, Monster } from '../types'
import { useCampaignStore } from '../store/campaignStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { useCombatStore, combatOf } from '../store/combatStore'
import { usePartyStore, partyOf } from '../store/partyStore'
import { useSrd } from '../srd/useSrd'
import { open5eCreatureToMonster } from '../srd/open5eCreatureToMonster'
import { xpBudget, encounterXpTotal, resultingDifficulty, partyToGroups } from '../utils/encounterXp'
import { crLabel } from '../utils/monster'
import { MonsterCard } from '../components/bestiary/MonsterCard'
import { MonsterTile } from '../components/bestiary/MonsterTile'
import { Button, Input, Select, Textarea } from '../components/ui'
import { useT } from '../i18n'

const DIFFICULTY_STYLE: Record<'trivial' | 'low' | 'moderate' | 'high', { badge: string; bar: string }> = {
    trivial: { badge: 'bg-ui-surface2 text-ui-muted', bar: 'bg-ui-muted' },
    low: { badge: 'bg-green-500/15 text-green-600', bar: 'bg-green-500' },
    moderate: { badge: 'bg-danger-yellow/15 text-danger-yellow', bar: 'bg-danger-yellow' },
    high: { badge: 'bg-danger-primary/15 text-danger-primary', bar: 'bg-danger-primary' },
}

function EncounterBuilder() {
    const t = useT()
    const { campaigns, currentCampaignId, addEncounter, updateEncounter, removeEncounter, setActiveEncounter } = useCampaignStore()
    const combats = useCombatStore((s) => s.combats)
    const members = usePartyStore((s) => partyOf(s, currentCampaignId))
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const encounters = useMemo(() => campaign?.encounters ?? [], [campaign?.encounters])
    // Fallback al primero: si el activo apunta a un encuentro borrado, la página no se queda vacía.
    const encounter = encounters.find((e) => e.id === campaign?.activeEncounterId) ?? encounters[0] ?? null

    const [search, setSearch] = useState('')
    const [crFilter, setCrFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [viewing, setViewing] = useState<Monster | null>(null)

    const { data } = useSrd<unknown[]>('creatures')
    const homebrew = useBestiaryStore((s) => s.monsters)
    const allMonsters = useMemo(
        () => [...homebrew, ...(data ?? []).map(open5eCreatureToMonster)].sort((a, b) => a.name.localeCompare(b.name)),
        [homebrew, data],
    )
    const xpById = useMemo(() => new Map(allMonsters.map((m) => [m.id, m.xp])), [allMonsters])
    const monstersById = useMemo(() => new Map(allMonsters.map((m) => [m.id, m])), [allMonsters])

    const crOptions = useMemo(() => [...new Set(allMonsters.map((m) => m.cr))].sort((a, b) => a - b), [allMonsters])
    const typeOptions = useMemo(
        () => [...new Set(allMonsters.map((m) => m.type).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [allMonsters],
    )

    const library = useMemo(() => {
        const q = search.trim().toLowerCase()
        return allMonsters.filter((m) => {
            if (q && !m.name.toLowerCase().includes(q)) return false
            if (crFilter !== 'all' && String(m.cr) !== crFilter) return false
            if (typeFilter !== 'all' && m.type !== typeFilter) return false
            return true
        })
    }, [allMonsters, search, crFilter, typeFilter])

    // Party ligada al roster real de la campaña: niveles leídos de partyStore.
    const party = useMemo(() => partyToGroups(members), [members])
    const totalXp = encounterXpTotal(encounter?.entries ?? [], xpById)
    const budgets = {
        low: xpBudget(party, 'low'),
        moderate: xpBudget(party, 'moderate'),
        high: xpBudget(party, 'high'),
    }
    const difficulty = resultingDifficulty(totalXp, party)
    const pct = budgets.high > 0 ? Math.min(100, (totalXp / budgets.high) * 100) : 0
    const style = DIFFICULTY_STYLE[difficulty]

    if (!currentCampaignId || !campaign) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2">
                    <h2 className="text-xl text-ui-text font-display mb-2">{t('encounters.noCampaign')}</h2>
                    <p className="text-ui-muted text-sm">{t('encounters.noCampaignHint')}</p>
                </div>
            </div>
        )
    }

    const patch = (updates: Partial<Encounter>) => {
        if (encounter) updateEncounter(currentCampaignId, encounter.id, updates)
    }

    const handleCreate = () => {
        const created: Encounter = {
            id: crypto.randomUUID(),
            name: t('encounters.defaultName'),
            entries: [],
        }
        addEncounter(currentCampaignId, created)
        setActiveEncounter(currentCampaignId, created.id)
    }

    const handleDelete = () => {
        if (!encounter) return
        useCombatStore.getState().removeCombat(encounter.id)
        removeEncounter(currentCampaignId, encounter.id)
    }

    const addEntry = (monsterId: string) => {
        if (!encounter) return
        const existing = encounter.entries.find((e) => e.monsterId === monsterId)
        patch({
            entries: existing
                ? encounter.entries.map((e) => (e.monsterId === monsterId ? { ...e, count: e.count + 1 } : e))
                : [...encounter.entries, { monsterId, count: 1 }],
        })
    }

    const setCount = (monsterId: string, count: number) => {
        if (!encounter) return
        patch({
            entries: count <= 0
                ? encounter.entries.filter((e) => e.monsterId !== monsterId)
                : encounter.entries.map((e) => (e.monsterId === monsterId ? { ...e, count } : e)),
        })
    }

    const countOf = (monsterId: string): string | undefined => {
        const entry = encounter?.entries.find((e) => e.monsterId === monsterId)
        return entry ? `×${entry.count}` : undefined
    }

    return (
        <div className="flex gap-4 h-full overflow-hidden">

            {/* Lista de encuentros a la izquierda */}
            <div className="w-56 shrink-0 flex flex-col gap-2 min-h-0">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-ui-text font-display text-xl font-bold">{t('encounters.title')}</h1>
                    <Button variant="primary" size="sm" onClick={handleCreate}>+ {t('encounters.new')}</Button>
                </div>
                <div className="flex flex-col gap-1 overflow-y-auto min-h-0 pr-1">
                    {encounters.length === 0 && <p className="text-ui-muted text-xs py-2">{t('encounters.empty')}</p>}
                    {encounters.map((e) => {
                        const isActive = e.id === campaign.activeEncounterId
                        const running = combatOf({ combats }, e.id).status === 'running'
                        return (
                            <button
                                key={e.id}
                                onClick={() => setActiveEncounter(currentCampaignId, e.id)}
                                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors truncate ${
                                    isActive ? 'bg-accent text-accent-fg' : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                }`}
                            >
                                {running ? '⚔ ' : ''}{e.name}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Builder del encuentro seleccionado */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
                {!encounter ? (
                    <p className="text-ui-muted text-sm text-center py-10">{t('encounters.empty')}</p>
                ) : (
                    <div className="flex gap-4 flex-1 min-h-0">

                        {/* Biblioteca del bestiario */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2 min-h-0">
                            <p className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{t('encounters.library')}</p>
                            <div className="flex gap-2">
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t('encounters.searchPlaceholder')}
                                    className="flex-1"
                                />
                                <Select value={crFilter} onChange={(e) => setCrFilter(e.target.value)} className="flex-1">
                                    <option value="all">{t('bestiary.filterCrAll')}</option>
                                    {crOptions.map((cr) => <option key={cr} value={String(cr)}>CR {crLabel(cr)}</option>)}
                                </Select>
                                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1">
                                    <option value="all">{t('bestiary.filterTypeAll')}</option>
                                    {typeOptions.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
                                </Select>
                            </div>
                            <div className="overflow-y-auto flex-1 min-h-0 pr-1">
                                {library.length === 0 ? (
                                    <p className="text-ui-muted text-sm text-center py-8">{t('bestiary.empty')}</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {library.slice(0, 60).map((m) => (
                                            <MonsterTile
                                                key={m.id}
                                                monster={m}
                                                onClick={() => addEntry(m.id)}
                                                onViewDetails={() => setViewing(m)}
                                                badge={countOf(m.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel de configuración */}
                        <div className="w-80 shrink-0 flex flex-col gap-3 overflow-y-auto min-h-0 pr-1">
                            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-3">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 flex flex-col gap-1">
                                        <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{t('encounters.name')}</label>
                                        <Input value={encounter.name} onChange={(e) => patch({ name: e.target.value })} />
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>{t('encounters.delete')}</Button>
                                </div>
                            </div>

                            {/* Party — leída del roster real de la campaña */}
                            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-ui-text font-display font-semibold text-sm">{t('encounters.partyLinked')}</h3>
                                    <Link to="/party" className="text-xs text-ui-muted hover:text-ui-text underline">{t('nav.party')} →</Link>
                                </div>
                                {party.length === 0 ? (
                                    <p className="text-ui-muted text-xs">
                                        <Link to="/party" className="underline hover:text-ui-text">{t('encounters.partyEmpty')}</Link>
                                    </p>
                                ) : (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {party.map((g) => (
                                            <span key={g.level} className="text-[10px] font-bold text-arcane-secondary bg-arcane-secondary/10 border border-arcane-secondary/30 px-2 py-0.5 rounded-lg">
                                                {t('encounters.partyGroup', { count: g.count, level: g.level })}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Presupuesto */}
                            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-ui-text text-sm font-semibold">
                                        {t('encounters.totalXp')}: <span className="tabular-nums">{totalXp.toLocaleString('en-US')}</span>
                                    </p>
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${style.badge}`}>
                                        {t(`encounters.difficulty.${difficulty}`)}
                                    </span>
                                </div>
                                <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${pct}%` }} />
                                </div>
                                <p className="text-ui-muted text-[11px] tabular-nums">
                                    {t('encounters.budgets', {
                                        low: budgets.low.toLocaleString('en-US'),
                                        moderate: budgets.moderate.toLocaleString('en-US'),
                                        high: budgets.high.toLocaleString('en-US'),
                                    })}
                                </p>
                            </div>

                            {/* Roster */}
                            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-1.5">
                                <h3 className="text-ui-text font-display font-semibold text-sm">{t('encounters.roster')}</h3>
                                {encounter.entries.length === 0 && <p className="text-ui-muted text-xs">{t('encounters.noEntries')}</p>}
                                {encounter.entries.map((entry) => {
                                    const m = monstersById.get(entry.monsterId)
                                    return (
                                        <div key={entry.monsterId} className="flex items-center gap-1.5 bg-ui-bg/40 rounded px-2 py-1">
                                            <span className="text-xs text-ui-text truncate flex-1 min-w-0">
                                                {m?.name ?? t('encounters.unknownMonster')}
                                            </span>
                                            <button onClick={() => setCount(entry.monsterId, entry.count - 1)} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text text-xs font-bold">−</button>
                                            <span className="text-xs font-bold text-ui-text tabular-nums w-5 text-center">{entry.count}</span>
                                            <button onClick={() => setCount(entry.monsterId, entry.count + 1)} className="w-5 h-5 rounded bg-ui-surface2 text-ui-text text-xs font-bold">+</button>
                                            <span className="text-[10px] text-ui-muted tabular-nums w-14 text-right shrink-0">
                                                {((m?.xp ?? 0) * entry.count).toLocaleString('en-US')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Notas */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-semibold text-ui-muted uppercase tracking-wider">{t('encounters.notes')}</label>
                                <Textarea
                                    rows={3}
                                    value={encounter.notes ?? ''}
                                    onChange={(e) => patch({ notes: e.target.value.trim() === '' ? undefined : e.target.value })}
                                    placeholder={t('encounters.notesPlaceholder')}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal statblock */}
            {viewing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ui-bg/80 backdrop-blur-sm" onClick={() => setViewing(null)}>
                    <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto modal-enter" onClick={(e) => e.stopPropagation()}>
                        <MonsterCard monster={viewing} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default EncounterBuilder
