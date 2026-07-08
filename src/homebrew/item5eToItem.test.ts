import { describe, it, expect } from 'vitest'
import { convert5eItem, itemTo5e } from './item5eToItem'

const cloak = {
    name: 'Homebrew Cloak of Protection',
    source: 'HB',
    rarity: 'uncommon',
    type: 'W',
    wondrous: true,
    reqAttune: true,
    entries: ['You gain a {@bonus 1} bonus to AC and saving throws while you wear this cloak.'],
}

describe('convert5eItem', () => {
    it('mapea un objeto 5etools wondrous', () => {
        const i = convert5eItem(cloak)
        expect(i.name).toBe('Homebrew Cloak of Protection')
        expect(i.rarity).toBe('Uncommon')
        expect(i.type).toBe('Wondrous Item')
        expect(i.requiresAttunement).toBe(true)
        expect(i.attunementDetail).toBeNull()
        expect(i.source).toBe('homebrew')
        expect(i.key).toBe('')
        expect(i.desc).toContain('bonus to AC')
    })
    it('type con sufijo de fuente, atunement con detalle y rareza', () => {
        const i = convert5eItem({ name: 'Blade', rarity: 'rare', type: 'M|XPHB', reqAttune: 'by a spellcaster' })
        expect(i.type).toBe('Melee Weapon')
        expect(i.rarity).toBe('Rare')
        expect(i.requiresAttunement).toBe(true)
        expect(i.attunementDetail).toBe('by a spellcaster')
    })
    it('sin rareza/attune y defaults', () => {
        const i = convert5eItem({ rarity: 'none' })
        expect(i.rarity).toBe('')
        expect(i.requiresAttunement).toBe(false)
        expect(i.attunementDetail).toBeNull()
        expect(i.name).toBe('')
    })
})

describe('itemTo5e', () => {
    it('inverso best-effort con lo esencial', () => {
        const raw = itemTo5e(convert5eItem(cloak)) as Record<string, unknown>
        expect(raw.name).toBe('Homebrew Cloak of Protection')
        expect(raw.rarity).toBe('uncommon')
        expect(raw.wondrous).toBe(true)
        expect(Array.isArray(raw.entries)).toBe(true)
    })
})
