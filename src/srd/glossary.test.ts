import { describe, it, expect } from 'vitest'
import { buildGlossary, searchGlossary } from './glossary'
import { acidArrowRaw } from './fixtures/spells.fixture'
import { adamantineArmorRaw } from './fixtures/magicitems.fixture'
import type { Spell, MagicItem } from '../types'

describe('buildGlossary', () => {
    it('condiciones: aplica el suplemento sobre la API vacía', () => {
        const g = buildGlossary({
            conditions: [{ name: 'Blinded', desc: '', key: 'core_blinded' }],
            conditionsSupplement: [
                { name: 'Blinded', desc: 'A Blinded creature can\'t see.' },
                { name: 'Prone', desc: 'A Prone creature is on the ground.' },
            ],
        })
        const names = g.condition.map((c) => c.name).sort()
        expect(names).toEqual(['Blinded', 'Prone'])
        expect(g.condition.find((c) => c.name === 'Blinded')!.desc).toContain('can\'t see')
        expect(g.condition.every((c) => c.category === 'condition')).toBe(true)
    })
    it('conjuros: ficha con meta', () => {
        const g = buildGlossary({ spells: [acidArrowRaw] })
        expect(g.spell).toHaveLength(1)
        const s = g.spell[0]
        expect(s.category).toBe('spell')
        expect(s.name).toBe('Acid Arrow')
        expect(s.meta?.Level).toBe('2')
        expect(s.meta?.School).toBe('Evocation')
        expect(s.meta?.Range).toBe('90 feet')
        expect(s.meta?.Components).toBe('V, S, M (powdered rhubarb leaf)')
    })
    it('cantrip → Level "Cantrip"', () => {
        const g = buildGlossary({ spells: [{ ...acidArrowRaw, level: 0 }] })
        expect(g.spell[0].meta?.Level).toBe('Cantrip')
    })
    it('objetos: ficha con meta y atunement', () => {
        const g = buildGlossary({ magicitems: [adamantineArmorRaw] })
        expect(g.item).toHaveLength(1)
        expect(g.item[0].meta?.Type).toBe('Armor')
        expect(g.item[0].meta?.Rarity).toBe('Uncommon')
        expect(g.item[0].meta?.Attunement).toBe('No')
    })
    it('reglas: aplana rulesets a entradas de categoría rule', () => {
        const g = buildGlossary({
            rulesets: [{ key: 'combat', name: 'Combat', rules: [{ key: 'cover', name: 'Cover', desc: 'Half cover…', index: 0 }] }],
        })
        expect(g.rule).toHaveLength(1)
        expect(g.rule[0]).toMatchObject({ category: 'rule', key: 'cover', name: 'Cover' })
    })
    it('categorías vacías por defecto', () => {
        const g = buildGlossary({})
        expect(g).toEqual({ rule: [], condition: [], spell: [], item: [] })
    })
})

describe('buildGlossary rulesSupplement', () => {
    it('fusiona el suplemento de reglas en la categoría rule', () => {
        const g = buildGlossary({
            rulesets: [{ key: 'combat', name: 'Combat', rules: [{ key: 'cover', name: 'Cover', desc: 'API cover', index: 0 }] }],
            rulesSupplement: [
                { name: 'Cover', desc: 'SUPP cover' },
                { name: 'Opportunity Attacks', desc: 'You can make an Opportunity Attack…' },
            ],
        })
        const names = g.rule.map((r) => r.name)
        expect(names).toContain('Cover')
        expect(names).toContain('Opportunity Attacks')
        // solapamiento: se conserva el desc de la API, no se duplica
        expect(g.rule.filter((r) => r.name === 'Cover')).toHaveLength(1)
        expect(g.rule.find((r) => r.name === 'Cover')!.desc).toBe('API cover')
        // el añadido tiene key = slug del nombre
        expect(g.rule.find((r) => r.name === 'Opportunity Attacks')!.key).toBe('opportunity-attacks')
    })
})

describe('buildGlossary homebrew', () => {
    it('mezcla conjuros/objetos homebrew en sus categorías', () => {
        const hbSpell: Spell = {
            key: 'hb:1', name: 'Custom Bolt', level: 1, school: 'Evocation', castingTime: '1 action',
            range: '60 feet', components: 'V', duration: 'Instantaneous', concentration: false, ritual: false,
            desc: 'zap', classes: [], source: 'homebrew',
        }
        const hbItem: MagicItem = {
            key: 'hb:2', name: 'Custom Ring', type: 'Ring', rarity: 'Rare', requiresAttunement: true,
            attunementDetail: null, desc: 'shiny', source: 'homebrew',
        }
        const g = buildGlossary({ spells: [acidArrowRaw], magicitems: [adamantineArmorRaw], homebrewSpells: [hbSpell], homebrewItems: [hbItem] })
        expect(g.spell.map((s) => s.name)).toContain('Custom Bolt')
        expect(g.item.map((i) => i.name)).toContain('Custom Ring')
        expect(g.spell.find((s) => s.name === 'Custom Bolt')!.meta?.School).toBe('Evocation')
    })
})

describe('searchGlossary', () => {
    const entries = [
        { category: 'spell', key: 'a', name: 'Fireball', desc: 'a bright streak' } as const,
        { category: 'rule', key: 'b', name: 'Fire', desc: 'burning' } as const,
        { category: 'item', key: 'c', name: 'Cloak', desc: 'wreathed in fire' } as const,
    ]
    it('prioriza startsWith > includes > desc y respeta el límite', () => {
        const r = searchGlossary(entries, 'fire', 10)
        expect(r.map((e) => e.name)).toEqual(['Fire', 'Fireball', 'Cloak'])
    })
    it('query < 2 chars devuelve vacío', () => {
        expect(searchGlossary(entries, 'f')).toEqual([])
    })
})
