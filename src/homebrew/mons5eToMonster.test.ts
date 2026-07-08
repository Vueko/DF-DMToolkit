import { describe, it, expect } from 'vitest'
import { convert5eMonster, monsterTo5e } from './mons5eToMonster'
import { chillbornZombie, smallTreant } from './fixtures/homebrew5e.fixture'

describe('convert5eMonster — Chillborn Zombie', () => {
    const m = convert5eMonster(chillbornZombie)
    it('identidad y cabecera', () => {
        expect(m.id.startsWith('hb:')).toBe(true)
        expect(m.source).toBe('homebrew')
        expect(m.name).toBe('Chillborn Zombie')
        expect(m.size).toBe('Medium')
        expect(m.type).toBe('Undead')
    })
    it('defensas y cr/xp', () => {
        expect(m.ac).toBe(14)
        expect(m.acNote).toBe('natural armor')
        expect(m.hp).toEqual({ average: 75, formula: '10d8 + 30' })
        expect(m.immunities).toBe('cold, poison')
        expect(m.conditionImmunities).toBe('poisoned')
        expect(m.cr).toBe(3)
        expect(m.xp).toBe(700)
    })
    it('secciones y tags aplanados', () => {
        expect(m.passives.map((p) => p.name)).toEqual(['Chillborne Aura', 'Supercooled'])
        expect(m.actions.map((a) => a.name)).toEqual(['Multiattack', 'Ice Reaper Slam'])
        expect(m.reactions.map((r) => r.name)).toEqual(['Flash Freeze (Recharge 6)'])
        expect(m.actions[1].description).toContain('+7 to hit')   // {@hit 7}
        expect(m.senses).toContain('passive Perception 8')
    })
})

describe('convert5eMonster — Small Treant', () => {
    const m = convert5eMonster(smallTreant)
    it('speed, resist/vulnerable, languages', () => {
        expect(m.type).toBe('Plant')
        expect(m.speed).toBe('30 ft., burrow 10 ft.')
        expect(m.resistances).toBe('bludgeoning')
        expect(m.vulnerabilities).toBe('fire')
        expect(m.conditionImmunities).toBe('charmed, prone, unconscious')
        expect(m.languages).toContain('Common')
        expect(m.cr).toBe(1)
        expect(m.xp).toBe(200)
    })
})

describe('monsterTo5e (round-trip escalar)', () => {
    it('invierte campos escalares y envuelve las habilidades en entries', () => {
        const back = monsterTo5e(convert5eMonster(chillbornZombie)) as Record<string, unknown>
        expect(back.name).toBe('Chillborn Zombie')
        expect(back.cr).toBe('3')
        expect(back.size).toEqual(['M'])
        expect(Array.isArray(back.action)).toBe(true)
    })
})
