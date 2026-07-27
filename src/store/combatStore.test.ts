import { describe, it, expect, beforeEach } from 'vitest'
import { useCombatStore, combatOf, migrateCombatV1toV2 } from './combatStore'
import { useDiceStore } from './diceStore'
import type { Combatant, EnemyInstance } from '../types'

const c = (id: string, init = 0, dex?: number, kind: 'pc' | 'enemy' = 'enemy'): Combatant =>
    ({ id, kind, refId: id, initiative: init, dexScore: dex })
const inst = (id: string, over: Partial<EnemyInstance> = {}): EnemyInstance =>
    ({ instanceId: id, monsterId: 'srd:goblin', label: 'G', hpCurrent: 10, hpMax: 10, conditions: [], ...over })

const get = () => useCombatStore.getState()
beforeEach(() => {
    useCombatStore.setState({ combats: {} })
    useDiceStore.setState({ history: [], trayOpen: false, mode: 'normal' })
})

describe('setup y orden', () => {
    it('addCombatants dedupe por id', () => {
        get().addCombatants('e1', [c('a')], [inst('a')])
        get().addCombatants('e1', [c('a')])
        expect(combatOf(get(), 'e1').combatants).toHaveLength(1)
    })
    it('startCombat ordena desc por iniciativa con desempate dex', () => {
        get().addCombatants('e1', [c('a', 10, 12), c('b', 15, 8), c('c', 10, 16)])
        get().startCombat('e1')
        const combat = combatOf(get(), 'e1')
        expect(combat.status).toBe('running')
        expect(combat.round).toBe(1)
        expect(combat.combatants.map((x) => x.id)).toEqual(['b', 'c', 'a'])
    })
    it('rollEnemyInitiative: una tirada por monsterId (grupo) + mod DEX', () => {
        get().addCombatants('e1',
            [c('g1', 0, 14), c('g2', 0, 14), { ...c('w1', 0, 10), refId: 'w1' }],
            [inst('g1'), inst('g2'), inst('w1', { monsterId: 'srd:wolf' })],
        )
        get().rollEnemyInitiative('e1', () => 0.5)   // d20 = 11
        const [g1, g2, w1] = combatOf(get(), 'e1').combatants
        expect(g1.initiative).toBe(11 + 2)           // dex 14 → +2
        expect(g2.initiative).toBe(g1.initiative)
        expect(w1.initiative).toBe(11 + 0)           // dex 10 → +0
    })
    it('rollEnemyInitiative usa initiativeBonus 2024 si existe', () => {
        get().addCombatants('e1',
            [{ ...c('d1', 0, 10), initiativeBonus: 10 }],
            [inst('d1', { monsterId: 'hb:dragon' })],
        )
        get().rollEnemyInitiative('e1', () => 0.5)   // d20 = 11
        expect(combatOf(get(), 'e1').combatants[0].initiative).toBe(11 + 10)   // no 11 + 0 (dex 10)
    })
})

describe('turnos y rondas', () => {
    beforeEach(() => {
        get().addCombatants('e1',
            [c('a', 20), c('b', 10)],
            [inst('a', { conditions: [{ conditionId: 'poisoned', roundsLeft: 2 }], legendaryActionsMax: 3, legendaryActionsLeft: 1 })],
        )
        get().startCombat('e1')
    })
    it('nextTurn avanza sin nueva ronda', () => {
        expect(get().nextTurn('e1')).toBe(false)
        expect(combatOf(get(), 'e1').turnIndex).toBe(1)
        expect(combatOf(get(), 'e1').round).toBe(1)
    })
    it('al envolver: ronda +1, decrementa condiciones de enemigos y resetea legendary actions', () => {
        get().nextTurn('e1')
        expect(get().nextTurn('e1')).toBe(true)
        const combat = combatOf(get(), 'e1')
        expect(combat.round).toBe(2)
        expect(combat.turnIndex).toBe(0)
        const enemy = combat.enemyInstances[0]
        expect(enemy.conditions[0].roundsLeft).toBe(1)
        expect(enemy.legendaryActionsLeft).toBe(3)
    })
    it('roundsLeft no baja de 0 y la condición no se elimina', () => {
        for (let i = 0; i < 8; i++) get().nextTurn('e1')
        expect(combatOf(get(), 'e1').enemyInstances[0].conditions[0].roundsLeft).toBe(0)
    })
    it('prevTurn retrocede y cruza rondas hacia atrás', () => {
        get().nextTurn('e1')
        get().nextTurn('e1')          // ronda 2, turno 0
        get().prevTurn('e1')
        expect(combatOf(get(), 'e1').round).toBe(1)
        expect(combatOf(get(), 'e1').turnIndex).toBe(1)
        get().prevTurn('e1')
        expect(combatOf(get(), 'e1').turnIndex).toBe(0)
        get().prevTurn('e1')          // en el inicio absoluto no pasa nada
        expect(combatOf(get(), 'e1').round).toBe(1)
        expect(combatOf(get(), 'e1').turnIndex).toBe(0)
    })
    it('los combates de encuentros distintos son independientes', () => {
        get().addCombatants('e2', [c('x', 5)])
        get().startCombat('e2')
        get().nextTurn('e1')
        expect(combatOf(get(), 'e1').turnIndex).toBe(1)
        expect(combatOf(get(), 'e2').turnIndex).toBe(0)
        expect(combatOf(get(), 'e2').round).toBe(1)
    })
})

describe('enemigos', () => {
    beforeEach(() => {
        get().addCombatants('e1', [c('a', 5)], [inst('a', { legendaryResistanceMax: 3, legendaryResistanceLeft: 1 })])
    })
    it('damageEnemy clampa [0, hpMax]', () => {
        get().damageEnemy('e1', 'a', -4)
        expect(combatOf(get(), 'e1').enemyInstances[0].hpCurrent).toBe(6)
        get().damageEnemy('e1', 'a', -99)
        expect(combatOf(get(), 'e1').enemyInstances[0].hpCurrent).toBe(0)
        get().damageEnemy('e1', 'a', +99)
        expect(combatOf(get(), 'e1').enemyInstances[0].hpCurrent).toBe(10)
    })
    it('el daño consume primero la vida temporal', () => {
        get().updateEnemyInstance('e1', 'a', { tempHp: 4 })
        get().damageEnemy('e1', 'a', -6)
        const enemy = combatOf(get(), 'e1').enemyInstances[0]
        expect(enemy.tempHp).toBe(0)
        expect(enemy.hpCurrent).toBe(8)
    })
    it('spendLegendaryResistance con suelo 0', () => {
        get().spendLegendaryResistance('e1', 'a')
        get().spendLegendaryResistance('e1', 'a')
        expect(combatOf(get(), 'e1').enemyInstances[0].legendaryResistanceLeft).toBe(0)
    })
    it('removeCombatant quita instancia y clampa turnIndex', () => {
        get().addCombatants('e1', [c('b', 3)])
        get().startCombat('e1')
        get().nextTurn('e1')          // turno en 'b' (index 1)
        get().removeCombatant('e1', 'b')
        const combat = combatOf(get(), 'e1')
        expect(combat.combatants.map((x) => x.id)).toEqual(['a'])
        expect(combat.enemyInstances).toHaveLength(1)
        expect(combat.turnIndex).toBe(0)
    })
    it('endCombat y removeCombat eliminan la entrada', () => {
        get().startCombat('e1')
        get().endCombat('e1')
        expect('e1' in get().combats).toBe(false)
        get().addCombatants('e2', [c('z')])
        get().removeCombat('e2')
        expect('e2' in get().combats).toBe(false)
    })
})

describe('combatOf y migración', () => {
    it('combatOf devuelve referencia estable para encuentros sin combate', () => {
        expect(combatOf(get(), 'nope')).toBe(combatOf(get(), 'nope'))
        expect(combatOf(get(), null)).toBe(combatOf(get(), undefined))
    })
    it('migrateCombatV1toV2 descarta el combate único viejo', () => {
        expect(migrateCombatV1toV2({ status: 'running', combatants: [{}] })).toEqual({ combats: {} })
        expect(migrateCombatV1toV2(undefined)).toEqual({ combats: {} })
    })
})

describe('rollEnemyInitiative → historial de dados', () => {
    it('loguea una tirada por grupo con label de iniciativa', () => {
        get().addCombatants('e1',
            [c('g1', 0, 14), c('g2', 0, 14), c('w1', 0, 12)],
            [
                inst('g1', { monsterId: 'm-goblin', label: 'Goblin 1' }),
                inst('g2', { monsterId: 'm-goblin', label: 'Goblin 2' }),
                inst('w1', { monsterId: 'm-wolf', label: 'Wolf 1' }),
            ])
        get().rollEnemyInitiative('e1', () => 0.5)   // d20 = 11
        const h = useDiceStore.getState().history
        expect(h).toHaveLength(2)                     // un roll por monsterId, no por instancia
        expect(h.map((r) => r.label).sort()).toEqual(['Initiative · Goblin', 'Initiative · Wolf'])
        expect(h[0].d20?.natural).toBe(11)
    })
})
