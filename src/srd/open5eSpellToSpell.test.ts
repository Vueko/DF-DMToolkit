import { describe, it, expect } from 'vitest'
import { open5eSpellToSpell } from './open5eSpellToSpell'
import { acidArrowRaw } from './fixtures/spells.fixture'

describe('open5eSpellToSpell', () => {
    it('mapea el conjuro real (Acid Arrow)', () => {
        const s = open5eSpellToSpell(acidArrowRaw)
        expect(s.key).toBe('srd-2024_acid-arrow')
        expect(s.name).toBe('Acid Arrow')
        expect(s.level).toBe(2)
        expect(s.school).toBe('Evocation')
        expect(s.castingTime).toBe('action')
        expect(s.range).toBe('90 feet')
        expect(s.components).toBe('V, S, M (powdered rhubarb leaf)')
        expect(s.duration).toBe('instantaneous')
        expect(s.concentration).toBe(false)
        expect(s.ritual).toBe(false)
        expect(s.classes).toEqual(['Wizard'])
    })
    it('componentes: solo verbal, material sin detalle', () => {
        const s = open5eSpellToSpell({ verbal: true, somatic: false, material: false })
        expect(s.components).toBe('V')
        const m = open5eSpellToSpell({ material: true })
        expect(m.components).toBe('M')
    })
    it('tolera campos ausentes con defaults', () => {
        const s = open5eSpellToSpell({})
        expect(s.name).toBe('')
        expect(s.level).toBe(0)
        expect(s.school).toBe('')
        expect(s.classes).toEqual([])
        expect(s.components).toBe('')
    })
})
