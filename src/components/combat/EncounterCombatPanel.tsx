import { useMemo, useState } from 'react'
import type { Encounter, EnemyInstance, Monster } from '../../types'
import { useCombatStore, combatOf } from '../../store/combatStore'
import { usePartyStore, partyOf } from '../../store/partyStore'
import { useBestiaryStore } from '../../store/bestiaryStore'
import { useSrd } from '../../srd/useSrd'
import { open5eCreatureToMonster } from '../../srd/open5eCreatureToMonster'
import { buildEnemyGroup } from '../../utils/combat'
import { abilityMod, fmtMod, crLabel } from '../../utils/monster'
import { MonsterCard } from '../bestiary/MonsterCard'
import { InitiativeRibbon } from './InitiativeRibbon'
import { EnemyGroupCard } from './EnemyGroupCard'
import { Button, Input } from '../ui'
import { useT } from '../../i18n'

interface EncounterCombatPanelProps {
    encounter: Encounter
    campaignId: string
}

// Panel completo de dirección del combate de UN encuentro (usado por /encounters y el Dashboard).
export function EncounterCombatPanel({ encounter, campaignId }: EncounterCombatPanelProps) {
    const t = useT()
    const store = useCombatStore()
    const combat = useCombatStore((s) => combatOf(s, encounter.id))
    const members = usePartyStore((s) => partyOf(s, campaignId))
    const { decrementConditionRounds } = usePartyStore()

    const { data } = useSrd<unknown[]>('creatures')
    const homebrew = useBestiaryStore((s) => s.monsters)
    const allMonsters = useMemo(
        () => [...homebrew, ...(data ?? []).map(open5eCreatureToMonster)],
        [homebrew, data],
    )
    const monstersById = useMemo(() => new Map(allMonsters.map((m) => [m.id, m])), [allMonsters])

    const [search, setSearch] = useState('')
    const [statblock, setStatblock] = useState<Monster | null>(null)
    const [showAdd, setShowAdd] = useState(false)

    const instancesById = useMemo(
        () => new Map(combat.enemyInstances.map((i) => [i.instanceId, i])),
        [combat.enemyInstances],
    )
    const combatantById = useMemo(
        () => new Map(combat.combatants.map((c) => [c.id, c])),
        [combat.combatants],
    )
    const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

    // Grupos de cards por tipo de monstruo, en orden de aparición.
    const groups = useMemo(() => {
        const seen = new Map<string, EnemyInstance[]>()
        for (const inst of combat.enemyInstances) {
            const list = seen.get(inst.monsterId) ?? []
            list.push(inst)
            seen.set(inst.monsterId, list)
        }
        return [...seen.entries()]
    }, [combat.enemyInstances])

    const searchResults = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (q.length < 2) return []
        return allMonsters.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 8)
    }, [allMonsters, search])

    const idle = combat.status === 'idle'

    const handlePrepare = () => {
        // Party de la campaña (los ya presentes se dedupean en el store)…
        store.addCombatants(encounter.id, members.map((m) => ({ id: m.id, kind: 'pc' as const, refId: m.id, initiative: 0 })))
        // …más las entradas del encuentro expandidas a instancias.
        let existing = combatOf(useCombatStore.getState(), encounter.id).enemyInstances
        for (const entry of encounter.entries) {
            const monster = monstersById.get(entry.monsterId)
            if (!monster) continue
            const group = buildEnemyGroup(monster, entry.count, existing)
            existing = [...existing, ...group.instances]
            store.addCombatants(encounter.id, group.combatants, group.instances)
        }
        store.rollEnemyInitiative(encounter.id)
    }

    const handleAddMonster = (monster: Monster) => {
        const group = buildEnemyGroup(monster, 1, combat.enemyInstances)
        store.addCombatants(encounter.id, group.combatants, group.instances)
        setSearch('')
    }

    const handleNext = () => {
        if (store.nextTurn(encounter.id)) decrementConditionRounds(campaignId)
    }

    const setupControls = (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <Button variant="primary" size="sm" onClick={handlePrepare}>
                    ⚔ {t('combat.prepare')}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => store.rollEnemyInitiative(encounter.id)} disabled={combat.combatants.length === 0}>
                    🎲 {t('initiative.rollEnemies')}
                </Button>
                {idle && (
                    <Button variant="primary" size="sm" onClick={() => store.startCombat(encounter.id)} disabled={combat.combatants.length === 0}>
                        {t('initiative.start')}
                    </Button>
                )}
                <div className="relative w-64">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('initiative.searchPlaceholder')} />
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-ui-surface border border-ui-surface2 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                            {searchResults.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => handleAddMonster(m)}
                                    className="w-full text-left px-3 py-1.5 text-sm text-ui-muted hover:text-ui-text hover:bg-ui-surface2 flex justify-between gap-2"
                                >
                                    <span className="truncate">{m.name}</span>
                                    <span className="shrink-0 text-[10px] opacity-70">CR {crLabel(m.cr)}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex flex-col gap-3">
            {idle ? (
                <>
                    {setupControls}
                    {combat.combatants.length === 0 ? (
                        <p className="text-ui-muted text-xs">{t('combat.noCombatants')}</p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {combat.combatants.map((c) => {
                                const name = c.kind === 'pc'
                                    ? (memberById.get(c.refId)?.name || '—')
                                    : (instancesById.get(c.refId)?.label ?? '—')
                                return (
                                    <div key={c.id} className="flex items-center gap-2 bg-ui-surface rounded-lg border border-ui-surface2/60 px-3 py-1.5">
                                        <div className="w-16 shrink-0">
                                            <Input
                                                type="number"
                                                value={c.initiative}
                                                onChange={(e) => store.setInitiative(encounter.id, c.id, Math.round(+e.target.value || 0))}
                                            />
                                        </div>
                                        <span className="text-sm text-ui-text truncate">{name}</span>
                                        {c.kind === 'enemy' && c.dexScore !== undefined && (
                                            <span className="text-[10px] text-ui-muted">DEX {fmtMod(abilityMod(c.dexScore))}</span>
                                        )}
                                        <button
                                            onClick={() => store.removeCombatant(encounter.id, c.id)}
                                            className="ml-auto w-5 h-5 text-xs text-ui-muted hover:text-red-500"
                                            title={t('initiative.remove')}
                                        >✕</button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <InitiativeRibbon
                        combat={combat}
                        members={members}
                        instancesById={instancesById}
                        campaignId={campaignId}
                        onPrev={() => store.prevTurn(encounter.id)}
                        onNext={handleNext}
                        onEnd={() => store.endCombat(encounter.id)}
                    />
                    <div>
                        <Button variant="ghost" size="sm" onClick={() => setShowAdd((v) => !v)}>{t('combat.addMore')}</Button>
                        {showAdd && setupControls}
                    </div>
                    <div className="flex flex-row flex-wrap gap-3 items-start">
                        {groups.map(([monsterId, instances]) => {
                            const monster = monstersById.get(monsterId)
                            if (!monster) return null
                            return (
                                <EnemyGroupCard
                                    key={monsterId}
                                    encounterId={encounter.id}
                                    monster={monster}
                                    instances={instances}
                                    combatantById={combatantById}
                                    onOpenStatblock={setStatblock}
                                />
                            )
                        })}
                    </div>
                </>
            )}

            {statblock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ui-bg/80 backdrop-blur-sm" onClick={() => setStatblock(null)}>
                    <div className="max-w-xl w-full max-h-[90vh] overflow-y-auto modal-enter" onClick={(e) => e.stopPropagation()}>
                        <MonsterCard monster={statblock} />
                    </div>
                </div>
            )}
        </div>
    )
}
