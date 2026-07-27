import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import { sortCombatants, d20, applyDamage } from '../utils/combat'
import { abilityMod } from '../utils/monster'
import { useDiceStore } from './diceStore'
import { d20RollResult } from '../dice/roll'
import { translate } from '../i18n'
import { useSettingsStore } from './settingsStore'
import type { EncounterCombat, Combatant, EnemyInstance } from '../types'

interface CombatStoreState {
    combats: Record<string, EncounterCombat>   // key: Encounter.id
    addCombatants: (encounterId: string, combatants: Combatant[], instances?: EnemyInstance[]) => void
    removeCombatant: (encounterId: string, id: string) => void
    setInitiative: (encounterId: string, id: string, value: number) => void
    toggleHidden: (encounterId: string, id: string) => void
    rollEnemyInitiative: (encounterId: string, rng?: () => number) => void
    startCombat: (encounterId: string) => void
    nextTurn: (encounterId: string) => boolean
    prevTurn: (encounterId: string) => void
    endCombat: (encounterId: string) => void
    removeCombat: (encounterId: string) => void
    updateEnemyInstance: (encounterId: string, instanceId: string, updates: Partial<EnemyInstance>) => void
    damageEnemy: (encounterId: string, instanceId: string, delta: number) => void
    spendLegendaryAction: (encounterId: string, instanceId: string, cost?: number) => void
    spendLegendaryResistance: (encounterId: string, instanceId: string) => void
}

// Referencia estable para encuentros sin combate (los selectores de zustand v5
// usan useSyncExternalStore: un objeto nuevo por snapshot = re-render infinito).
export const EMPTY_COMBAT: EncounterCombat = Object.freeze({
    status: 'idle' as const, round: 0, turnIndex: 0,
    combatants: Object.freeze([]) as unknown as Combatant[],
    enemyInstances: Object.freeze([]) as unknown as EnemyInstance[],
})

export const combatOf = (
    state: Pick<CombatStoreState, 'combats'>,
    encounterId: string | null | undefined,
): EncounterCombat =>
    (encounterId ? state.combats[encounterId] : undefined) ?? EMPTY_COMBAT

// v1 (combate global único) → v2 (por encuentro): el combate era estado efímero
// de sesión; se descarta el estado recibido.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function migrateCombatV1toV2(_state?: unknown): unknown {
    return { combats: {} }
}

export const useCombatStore = create<CombatStoreState>()(
    persist(
        (set, get) => {
            const mutate = (encounterId: string, fn: (c: EncounterCombat) => EncounterCombat) =>
                set((s) => ({
                    combats: { ...s.combats, [encounterId]: fn(s.combats[encounterId] ?? { ...EMPTY_COMBAT, combatants: [], enemyInstances: [] }) },
                }))
            const drop = (encounterId: string) =>
                set((s) => {
                    const combats = { ...s.combats }
                    delete combats[encounterId]
                    return { combats }
                })
            return {
                combats: {},

                addCombatants: (encounterId, combatants, instances = []) => mutate(encounterId, (c) => {
                    const known = new Set(c.combatants.map((x) => x.id))
                    return {
                        ...c,
                        combatants: [...c.combatants, ...combatants.filter((x) => !known.has(x.id))],
                        enemyInstances: [...c.enemyInstances, ...instances.filter((i) => !known.has(i.instanceId))],
                    }
                }),

                removeCombatant: (encounterId, id) => mutate(encounterId, (c) => {
                    const combatants = c.combatants.filter((x) => x.id !== id)
                    return {
                        ...c,
                        combatants,
                        enemyInstances: c.enemyInstances.filter((i) => i.instanceId !== id),
                        turnIndex: Math.min(c.turnIndex, Math.max(0, combatants.length - 1)),
                    }
                }),

                setInitiative: (encounterId, id, value) => mutate(encounterId, (c) => ({
                    ...c,
                    combatants: c.combatants.map((x) => (x.id === id ? { ...x, initiative: value } : x)),
                })),

                toggleHidden: (encounterId, id) => mutate(encounterId, (c) => ({
                    ...c,
                    combatants: c.combatants.map((x) => (x.id === id ? { ...x, hidden: !x.hidden } : x)),
                })),

                // Una tirada por tipo de monstruo (monsterId); cada instancia hereda la del grupo.
                // Cada tirada de grupo se loguea en el historial de dados.
                rollEnemyInitiative: (encounterId, rng = Math.random) => mutate(encounterId, (c) => {
                    const byMonster = new Map<string, number>()
                    const instanceById = new Map(c.enemyInstances.map((i) => [i.instanceId, i]))
                    const initiativeLabel = translate(useSettingsStore.getState().language, 'dice.initiative')
                    return {
                        ...c,
                        combatants: c.combatants.map((x) => {
                            if (x.kind !== 'enemy') return x
                            const instance = instanceById.get(x.refId)
                            const monsterId = instance?.monsterId ?? x.refId
                            const bonus = x.initiativeBonus ?? abilityMod(x.dexScore ?? 10)
                            if (!byMonster.has(monsterId)) {
                                const natural = d20(rng)
                                byMonster.set(monsterId, natural)
                                const groupName = (instance?.label ?? x.refId).replace(/ \d+$/, '')
                                useDiceStore.getState().logRoll(d20RollResult(natural, bonus, `${initiativeLabel} · ${groupName}`))
                            }
                            return { ...x, initiative: byMonster.get(monsterId)! + bonus }
                        }),
                    }
                }),

                startCombat: (encounterId) => mutate(encounterId, (c) => ({
                    ...c, status: 'running', round: 1, turnIndex: 0, combatants: sortCombatants(c.combatants),
                })),

                nextTurn: (encounterId) => {
                    const combat = combatOf(get(), encounterId)
                    if (combat.status !== 'running' || combat.combatants.length === 0) return false
                    const wrapped = combat.turnIndex + 1 >= combat.combatants.length
                    if (!wrapped) {
                        mutate(encounterId, (c) => ({ ...c, turnIndex: c.turnIndex + 1 }))
                        return false
                    }
                    mutate(encounterId, (c) => ({
                        ...c,
                        turnIndex: 0,
                        round: c.round + 1,
                        enemyInstances: c.enemyInstances.map((i) => ({
                            ...i,
                            conditions: i.conditions.map((cond) =>
                                cond.roundsLeft === undefined ? cond : { ...cond, roundsLeft: Math.max(0, cond.roundsLeft - 1) }),
                            ...(i.legendaryActionsMax !== undefined ? { legendaryActionsLeft: i.legendaryActionsMax } : {}),
                        })),
                    }))
                    return true
                },

                prevTurn: (encounterId) => mutate(encounterId, (c) => {
                    if (c.turnIndex > 0) return { ...c, turnIndex: c.turnIndex - 1 }
                    if (c.round > 1) return { ...c, round: c.round - 1, turnIndex: Math.max(0, c.combatants.length - 1) }
                    return c
                }),

                endCombat: (encounterId) => drop(encounterId),
                removeCombat: (encounterId) => drop(encounterId),

                updateEnemyInstance: (encounterId, instanceId, updates) => mutate(encounterId, (c) => ({
                    ...c,
                    enemyInstances: c.enemyInstances.map((i) => (i.instanceId === instanceId ? { ...i, ...updates } : i)),
                })),

                damageEnemy: (encounterId, instanceId, delta) => mutate(encounterId, (c) => ({
                    ...c,
                    enemyInstances: c.enemyInstances.map((i) =>
                        i.instanceId === instanceId
                            ? { ...i, ...applyDamage(i.hpCurrent, i.hpMax, i.tempHp ?? 0, delta) }
                            : i),
                })),

                spendLegendaryAction: (encounterId, instanceId, cost = 1) => mutate(encounterId, (c) => ({
                    ...c,
                    enemyInstances: c.enemyInstances.map((i) =>
                        i.instanceId === instanceId && i.legendaryActionsLeft !== undefined
                            ? { ...i, legendaryActionsLeft: Math.max(0, i.legendaryActionsLeft - cost) }
                            : i),
                })),

                spendLegendaryResistance: (encounterId, instanceId) => mutate(encounterId, (c) => ({
                    ...c,
                    enemyInstances: c.enemyInstances.map((i) =>
                        i.instanceId === instanceId && i.legendaryResistanceLeft !== undefined
                            ? { ...i, legendaryResistanceLeft: Math.max(0, i.legendaryResistanceLeft - 1) }
                            : i),
                })),
            }
        },
        { name: 'dnd-combat', version: 2, migrate: createMigrate<CombatStoreState>(2, { 2: migrateCombatV1toV2 }), storage: createJSONStorage(() => electronStorage) }
    )
)
