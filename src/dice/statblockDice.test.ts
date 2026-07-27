import { describe, it, expect } from 'vitest'
import { segmentDiceText, parseBonusPairs, segmentBonusText } from './statblockDice'

describe('segmentDiceText', () => {
    it('formato 2024: "Attack Roll: +N" y daño entre paréntesis', () => {
        const segs = segmentDiceText('Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.')
        const rolls = segs.filter((s) => s.kind === 'roll')
        expect(rolls).toEqual([
            { kind: 'roll', text: 'Attack Roll: +4', notation: '1d20+4', rollKind: 'attack' },
            { kind: 'roll', text: '(1d6 + 2)', notation: '1d6+2', rollKind: 'damage' },
        ])
    })
    it('formato legacy: "+N to hit"', () => {
        const segs = segmentDiceText('Melee Weapon Attack: +6 to hit, reach 5 ft., one target. Hit: 12 (2d8 + 3) slashing damage.')
        const rolls = segs.filter((s) => s.kind === 'roll')
        expect(rolls[0]).toEqual({ kind: 'roll', text: '+6 to hit', notation: '1d20+6', rollKind: 'attack' })
        expect(rolls[1]).toEqual({ kind: 'roll', text: '(2d8 + 3)', notation: '2d8+3', rollKind: 'damage' })
    })
    it('múltiples daños en una acción', () => {
        const segs = segmentDiceText('Hit: 7 (1d8 + 3) slashing damage plus 3 (1d6) fire damage.')
        const rolls = segs.filter((s) => s.kind === 'roll')
        expect(rolls.map((r) => r.kind === 'roll' && r.notation)).toEqual(['1d8+3', '1d6'])
    })
    it('texto sin dados queda como un único segmento de texto', () => {
        const text = 'The wolf has advantage on an attack roll against a creature.'
        expect(segmentDiceText(text)).toEqual([{ kind: 'text', text }])
        expect(segmentDiceText('DC 13 Dexterity saving throw. Recharge 5-6.').filter((s) => s.kind === 'roll')).toHaveLength(0)
    })
    it('la concatenación de segmentos reconstruye el texto original', () => {
        const text = 'Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.'
        expect(segmentDiceText(text).map((s) => s.text).join('')).toBe(text)
    })
})

describe('parseBonusPairs', () => {
    it('parsea saves y skills', () => {
        expect(parseBonusPairs('Dex +5, Con +3')).toEqual([
            { name: 'Dex', bonus: 5 }, { name: 'Con', bonus: 3 },
        ])
        expect(parseBonusPairs('Perception +6, Stealth +4')).toEqual([
            { name: 'Perception', bonus: 6 }, { name: 'Stealth', bonus: 4 },
        ])
        expect(parseBonusPairs('Animal Handling +7')).toEqual([{ name: 'Animal Handling', bonus: 7 }])
    })
    it('devuelve [] cuando no hay pares', () => {
        expect(parseBonusPairs('darkvision 60 ft.')).toEqual([])
    })
})

describe('segmentBonusText', () => {
    it('conserva el texto intermedio (comas, notas) y marca los pares', () => {
        const segs = segmentBonusText('Con +5 (while raging), Dex +3')
        expect(segs).toEqual([
            { kind: 'bonus', text: 'Con +5', name: 'Con', bonus: 5 },
            { kind: 'text', text: ' (while raging), ' },
            { kind: 'bonus', text: 'Dex +3', name: 'Dex', bonus: 3 },
        ])
    })
    it('la concatenación de segmentos reconstruye la línea original', () => {
        const line = 'Perception +6, Stealth +4 (only in dim light)'
        expect(segmentBonusText(line).map((s) => s.text).join('')).toBe(line)
    })
    it('sin pares devuelve un único segmento de texto', () => {
        expect(segmentBonusText('darkvision 60 ft.')).toEqual([{ kind: 'text', text: 'darkvision 60 ft.' }])
    })
})
