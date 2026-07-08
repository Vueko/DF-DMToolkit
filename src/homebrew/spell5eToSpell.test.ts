import { describe, it, expect } from 'vitest'
import { convert5eSpell, spellTo5e } from './spell5eToSpell'

const fireball = {
    name: 'Homebrew Fireball',
    source: 'HB',
    level: 3,
    school: 'Ev',
    time: [{ number: 1, unit: 'action' }],
    range: { type: 'point', distance: { type: 'feet', amount: 150 } },
    components: { v: true, s: true, m: 'a tiny ball of bat guano and sulfur' },
    duration: [{ type: 'instant' }],
    meta: { ritual: false },
    classes: { fromClassList: [{ name: 'Wizard', source: 'PHB' }, { name: 'Sorcerer', source: 'PHB' }] },
    entries: [
        'Each creature in a 20-foot-radius Sphere makes a {@dc 15} Dexterity save, taking {@damage 8d6} fire damage on a failure.',
        { type: 'list', items: ['It ignites flammable objects.'] },
    ],
    entriesHigherLevel: [{ name: 'At Higher Levels', entries: ['Damage increases by {@dice 1d6} per slot above 3rd.'] }],
}

describe('convert5eSpell', () => {
    it('mapea un conjuro 5etools', () => {
        const s = convert5eSpell(fireball)
        expect(s.name).toBe('Homebrew Fireball')
        expect(s.level).toBe(3)
        expect(s.school).toBe('Evocation')
        expect(s.castingTime).toBe('1 action')
        expect(s.range).toBe('150 feet')
        expect(s.components).toBe('V, S, M (a tiny ball of bat guano and sulfur)')
        expect(s.duration).toBe('Instantaneous')
        expect(s.concentration).toBe(false)
        expect(s.ritual).toBe(false)
        expect(s.classes).toEqual(['Wizard', 'Sorcerer'])
        expect(s.source).toBe('homebrew')
        expect(s.key).toBe('')
        // desc: tags aplanados y entradas/higher-level incluidas
        expect(s.desc).toContain('DC 15')
        expect(s.desc).toContain('8d6')
        expect(s.desc).toContain('ignites flammable objects')
        expect(s.desc).toContain('At Higher Levels')
    })
    it('componentes solo verbales; material booleano; concentración y ritual', () => {
        const s = convert5eSpell({
            components: { v: true },
            duration: [{ type: 'timed', duration: { type: 'minute', amount: 10 }, concentration: true }],
            meta: { ritual: true },
        })
        expect(s.components).toBe('V')
        expect(s.duration).toBe('10 minutes')
        expect(s.concentration).toBe(true)
        expect(s.ritual).toBe(true)
    })
    it('rango self con radio y defaults', () => {
        expect(convert5eSpell({ range: { type: 'radius', distance: { type: 'self' } } }).range).toBe('Self')
        expect(convert5eSpell({}).name).toBe('')
        expect(convert5eSpell({}).classes).toEqual([])
    })
    it('no lanza con fromClassList malformado (no-array)', () => {
        expect(convert5eSpell({ classes: { fromClassList: {} } }).classes).toEqual([])
    })
})

describe('spellTo5e', () => {
    it('inverso best-effort con lo esencial', () => {
        const raw = spellTo5e(convert5eSpell(fireball)) as Record<string, unknown>
        expect(raw.name).toBe('Homebrew Fireball')
        expect(raw.level).toBe(3)
        expect(raw.school).toBe('Ev')
        expect(Array.isArray(raw.entries)).toBe(true)
        expect((raw.entries as string[])[0]).toContain('fire damage')
    })
})
