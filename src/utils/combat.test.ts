import { describe, it, expect } from 'vitest'
import { buildEnemyGroup, sortCombatants, d20, applyDamage, isBloodied, deathSaveStatus, applyPcHp } from './combat'
import type { Monster, EnemyInstance, Combatant } from '../types'

const goblin: Monster = {
    id: 'srd:goblin', source: 'srd', name: 'Goblin', size: 'Small', type: 'Fey', alignment: 'cn',
    ac: 15, hp: { average: 10, formula: '3d6' }, speed: '30 ft.',
    stats: { str: 8, dex: 15, con: 10, int: 10, wis: 8, cha: 8 },
    cr: 0.25, xp: 50, passives: [], actions: [], bonusActions: [], reactions: [], legendaryActions: [],
}
const dragon: Monster = {
    ...goblin, id: 'srd:dragon', name: 'Dragon',
    legendaryActions: [{ id: 'x', name: 'Tail', description: '...' }], legendaryResistance: 3,
}

let n = 0
const makeId = () => `id-${++n}`

describe('buildEnemyGroup', () => {
    it('crea instancias numeradas con HP medio y combatants enlazados', () => {
        const { instances, combatants } = buildEnemyGroup(goblin, 2, [], makeId)
        expect(instances.map((i) => i.label)).toEqual(['Goblin 1', 'Goblin 2'])
        expect(instances[0]).toMatchObject({ monsterId: 'srd:goblin', hpCurrent: 10, hpMax: 10, conditions: [] })
        expect(combatants[0]).toMatchObject({ id: instances[0].instanceId, kind: 'enemy', refId: instances[0].instanceId, initiative: 0, dexScore: 15 })
    })
    it('continúa la numeración con instancias existentes del mismo monstruo', () => {
        const existing = [{ instanceId: 'e1', monsterId: 'srd:goblin', label: 'Goblin 1', hpCurrent: 10, hpMax: 10, conditions: [] }] as EnemyInstance[]
        const { instances } = buildEnemyGroup(goblin, 1, existing, makeId)
        expect(instances[0].label).toBe('Goblin 2')
    })
    it('sin legendary → sin contadores; con legendary → max y left inicializados', () => {
        const { instances: g } = buildEnemyGroup(goblin, 1, [], makeId)
        expect(g[0].legendaryActionsMax).toBeUndefined()
        const { instances: d } = buildEnemyGroup(dragon, 1, [], makeId)
        expect(d[0]).toMatchObject({ legendaryActionsMax: 3, legendaryActionsLeft: 3, legendaryResistanceMax: 3, legendaryResistanceLeft: 3 })
    })
})

describe('sortCombatants', () => {
    const c = (id: string, init: number, dex?: number): Combatant => ({ id, kind: 'enemy', refId: id, initiative: init, dexScore: dex })
    it('desc por iniciativa, desempate desc por dex, estable', () => {
        const sorted = sortCombatants([c('a', 10, 12), c('b', 15, 8), c('c', 10, 16), c('d', 10)])
        expect(sorted.map((x) => x.id)).toEqual(['b', 'c', 'a', 'd'])
    })
    it('no muta el array original', () => {
        const input = [c('a', 1), c('b', 2)]
        sortCombatants(input)
        expect(input.map((x) => x.id)).toEqual(['a', 'b'])
    })
})

describe('applyDamage', () => {
    it('el daño consume primero la vida temporal', () => {
        expect(applyDamage(10, 10, 5, -3)).toEqual({ hpCurrent: 10, tempHp: 2 })
    })
    it('el daño que excede los THP pasa a la vida real', () => {
        expect(applyDamage(10, 10, 3, -7)).toEqual({ hpCurrent: 6, tempHp: 0 })
    })
    it('clampa la vida a 0', () => {
        expect(applyDamage(4, 10, 0, -99)).toEqual({ hpCurrent: 0, tempHp: 0 })
    })
    it('la curación no toca los THP y clampa al máximo', () => {
        expect(applyDamage(6, 10, 2, +3)).toEqual({ hpCurrent: 9, tempHp: 2 })
        expect(applyDamage(9, 10, 2, +99)).toEqual({ hpCurrent: 10, tempHp: 2 })
    })
})

describe('isBloodied', () => {
    it('true en la mitad exacta o por debajo, con vida > 0', () => {
        expect(isBloodied(10, 20)).toBe(true)
        expect(isBloodied(5, 20)).toBe(true)
    })
    it('false por encima de la mitad', () => {
        expect(isBloodied(11, 20)).toBe(false)
    })
    it('false a 0 HP (eso es caído, no malherido)', () => {
        expect(isBloodied(0, 20)).toBe(false)
    })
    it('usa la mitad redondeada hacia abajo', () => {
        expect(isBloodied(3, 7)).toBe(true)   // floor(7/2)=3
        expect(isBloodied(4, 7)).toBe(false)
    })
})

describe('deathSaveStatus', () => {
    it('3 fallos → muerto (prioridad)', () => {
        expect(deathSaveStatus(0, 3)).toBe('dead')
        expect(deathSaveStatus(2, 3)).toBe('dead')
    })
    it('3 éxitos → estable', () => {
        expect(deathSaveStatus(3, 0)).toBe('stable')
    })
    it('resto → agonizando', () => {
        expect(deathSaveStatus(0, 0)).toBe('dying')
        expect(deathSaveStatus(2, 2)).toBe('dying')
    })
})

describe('applyPcHp', () => {
    const pc = (over: Partial<Parameters<typeof applyPcHp>[0]> = {}) =>
        ({ hpCurrent: 20, maxHp: 20, tempHp: 0, deathSaves: undefined, ...over })

    it('curar por encima de 0 limpia las salvaciones', () => {
        const out = applyPcHp(pc({ hpCurrent: 0, deathSaves: { successes: 1, failures: 2 } }), +5)
        expect(out.hpCurrent).toBe(5)
        expect(out.deathSaves).toBeUndefined()
    })
    it('caer de vida positiva a 0 arranca agonía en {0,0}', () => {
        const out = applyPcHp(pc({ hpCurrent: 8 }), -12)
        expect(out.hpCurrent).toBe(0)
        expect(out.deathSaves).toEqual({ successes: 0, failures: 0 })
    })
    it('daño estando ya a 0 suma un fallo', () => {
        const out = applyPcHp(pc({ hpCurrent: 0, deathSaves: { successes: 0, failures: 1 } }), -3)
        expect(out.hpCurrent).toBe(0)
        expect(out.deathSaves).toEqual({ successes: 0, failures: 2 })
    })
    it('daño >= vida máxima estando a 0 es muerte directa (3 fallos)', () => {
        const out = applyPcHp(pc({ hpCurrent: 0, maxHp: 20, deathSaves: { successes: 1, failures: 0 } }), -20)
        expect(out.deathSaves).toEqual({ successes: 1, failures: 3 })
    })
    it('el daño consume THP primero (vía applyDamage)', () => {
        const out = applyPcHp(pc({ hpCurrent: 10, tempHp: 4 }), -6)
        expect(out).toMatchObject({ hpCurrent: 8, tempHp: 0 })
    })
})

describe('d20', () => {
    it('rango 1..20 con rng inyectado', () => {
        expect(d20(() => 0)).toBe(1)
        expect(d20(() => 0.999999)).toBe(20)
        expect(d20(() => 0.5)).toBe(11)
    })
})
