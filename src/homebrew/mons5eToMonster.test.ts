import { describe, it, expect } from 'vitest'
import { convert5eMonster, monsterTo5e, AUDIO_5ETOOLS_BASE } from './mons5eToMonster'
import { crToProficiency } from './crXp'
import { chillbornZombie, smallTreant, adultBronzeDragonXmm } from './fixtures/homebrew5e.fixture'

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

describe('convert5eMonster — formato 2024 (Adult Bronze Dragon XMM)', () => {
    const m = convert5eMonster(adultBronzeDragonXmm)
    it('spellcasting como acción markdown', () => {
        const sc = m.actions.find((a) => a.name === 'Spellcasting')
        expect(sc).toBeDefined()
        expect(sc!.description).toContain('spell save DC 17')
        expect(sc!.description).toContain('**At Will:** Detect Magic, Guiding Bolt (level 2 version), Speak with Animals, Thaumaturgy')
        expect(sc!.description).toContain('**1/Day Each:** Detect Thoughts, Water Breathing')
    })
    it('tags 2024 legibles en acciones', () => {
        const breath = m.actions.find((a) => a.name.startsWith('Lightning Breath'))!
        expect(breath.description).toBe('Dexterity Saving Throw: DC 19, each creature in a 90-foot-long, 5-foot-wide Line. Failure: 55 (10d10) Lightning damage. Success: Half damage.')
    })
    it('initiativeBonus = mod DES + proficiency × PB(cr)', () => {
        expect(m.initiativeBonus).toBe(10)   // 0 + 2×5
    })
    it('soundClipUrl interna resuelta contra el mirror', () => {
        expect(m.soundClipUrl).toBe(`${AUDIO_5ETOOLS_BASE}bestiary/bronze-dragon.opus`)
    })
    it('campos 2014 intactos y legendary resistance', () => {
        expect(m.cr).toBe(15)
        expect(m.xp).toBe(13000)
        expect(m.legendaryResistance).toBe(3)
    })
    it('monstruo 2014 no gana campos nuevos', () => {
        const old = convert5eMonster(chillbornZombie)
        expect(old.initiativeBonus).toBeUndefined()
        expect(old.soundClipUrl).toBeUndefined()
    })
})

describe('crToProficiency', () => {
    it('progresión estándar por CR', () => {
        expect(crToProficiency(0)).toBe(2)
        expect(crToProficiency(0.25)).toBe(2)
        expect(crToProficiency(4)).toBe(2)
        expect(crToProficiency(5)).toBe(3)
        expect(crToProficiency(15)).toBe(5)
        expect(crToProficiency(30)).toBe(9)
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
    it('exporta soundClip como external', () => {
        const back = monsterTo5e(convert5eMonster(adultBronzeDragonXmm)) as Record<string, unknown>
        expect(back.soundClip).toEqual({ type: 'external', url: `${AUDIO_5ETOOLS_BASE}bestiary/bronze-dragon.opus` })
    })
})
