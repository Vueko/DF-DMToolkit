import { describe, it, expect } from 'vitest'
import { open5eItemToItem } from './open5eItemToItem'
import { adamantineArmorRaw } from './fixtures/magicitems.fixture'

describe('open5eItemToItem', () => {
    it('mapea el objeto real (Adamantine Armor)', () => {
        const i = open5eItemToItem(adamantineArmorRaw)
        expect(i.key).toBe('srd-2024_adamantine-armor-breastplate')
        expect(i.name).toBe('Adamantine Armor (Breastplate)')
        expect(i.type).toBe('Armor')
        expect(i.rarity).toBe('Uncommon')
        expect(i.requiresAttunement).toBe(false)
        expect(i.attunementDetail).toBeNull()
    })
    it('sintonización con detalle', () => {
        const i = open5eItemToItem({ requires_attunement: true, attunement_detail: 'by a spellcaster' })
        expect(i.requiresAttunement).toBe(true)
        expect(i.attunementDetail).toBe('by a spellcaster')
    })
    it('tolera campos ausentes', () => {
        const i = open5eItemToItem({})
        expect(i.name).toBe('')
        expect(i.type).toBe('')
        expect(i.rarity).toBe('')
        expect(i.requiresAttunement).toBe(false)
        expect(i.attunementDetail).toBeNull()
    })
})
