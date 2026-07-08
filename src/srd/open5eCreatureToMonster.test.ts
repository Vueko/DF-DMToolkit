import { describe, it, expect } from 'vitest'
import { open5eCreatureToMonster } from './open5eCreatureToMonster'
import { goblinWarrior, aboleth } from './fixtures/creatures.fixture'

describe('open5eCreatureToMonster — Goblin Warrior (fixture real)', () => {
    const m = open5eCreatureToMonster(goblinWarrior)
    it('identidad y cabecera', () => {
        expect(m.id).toBe('srd:srd-2024_goblin-warrior')
        expect(m.source).toBe('srd')
        expect(m.name).toBe('Goblin Warrior')
        expect(m.size).toBe('Small')
        expect(m.type).toBe('Fey')
        expect(m.alignment).toBe('chaotic neutral')
    })
    it('defensas y velocidad', () => {
        expect(m.ac).toBe(15)
        expect(m.acNote).toBe('natural armor')
        expect(m.hp).toEqual({ average: 10, formula: '3d6' })
        expect(m.speed).toBe('30 ft.')
    })
    it('stats y derivados', () => {
        expect(m.stats).toEqual({ str: 8, dex: 15, con: 10, int: 10, wis: 8, cha: 8 })
        expect(m.saves).toBeUndefined()          // saving_throws == modifiers → sin saves proficientes
        expect(m.skills).toBe('Stealth +6')
        expect(m.senses).toBe('Darkvision 60 ft., Passive Perception 9')
        expect(m.languages).toBe('Common, Goblin')
        expect(m.resistances).toBeUndefined()    // display vacío → undefined
        expect(m.cr).toBe(0.25)
        expect(m.xp).toBe(50)
    })
    it('acciones por tipo', () => {
        expect(m.actions.map((a) => a.name)).toEqual(['Scimitar', 'Shortbow'])
        expect(m.bonusActions.map((a) => a.name)).toEqual(['Nimble Escape'])
        expect(m.reactions).toEqual([])
        expect(m.legendaryActions).toEqual([])
        expect(m.passives).toEqual([])
        expect(m.actions[0].description).toContain('Melee Attack Roll: +4')
    })
})

describe('open5eCreatureToMonster — Aboleth (fixture real)', () => {
    const m = open5eCreatureToMonster(aboleth)
    it('cabecera y derivados', () => {
        expect(m.name).toBe('Aboleth')
        expect(m.size).toBe('Large')
        expect(m.type).toBe('Aberration')
        expect(m.ac).toBe(17)
        expect(m.hp.average).toBe(150)
        expect(m.saves).toBe('Dex +3, Con +6, Int +8, Wis +6')  // solo los que difieren del modificador
        expect(m.skills).toBe('History +12, Perception +10')
        expect(m.senses).toBe('Darkvision 120 ft., Passive Perception 20')
        expect(m.cr).toBe(10)
        expect(m.xp).toBe(5900)
    })
    it('traits, legendary y usage', () => {
        expect(m.passives.map((p) => p.name)).toContain('Amphibious')
        expect(m.legendaryResistance).toBe(3)   // parseado de "Legendary Resistance (3/Day, or 4/Day in Lair)"
        expect(m.legendaryActions.map((a) => a.name)).toEqual(['Lash', 'Psychic Drain'])
        const dominate = m.actions.find((a) => a.name === 'Dominate Mind')!
        expect(dominate.usage).toBe('2/Day')
    })
    it('ids de habilidades únicos y estables', () => {
        const all = [...m.passives, ...m.actions, ...m.legendaryActions]
        expect(new Set(all.map((a) => a.id)).size).toBe(all.length)
    })
})
