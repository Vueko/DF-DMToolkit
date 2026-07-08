import { describe, it, expect } from 'vitest'
import { crLabel, abilityMod, fmtMod } from './monster'

describe('crLabel', () => {
    it('formatea CRs fraccionarios', () => {
        expect(crLabel(0.125)).toBe('1/8')
        expect(crLabel(0.25)).toBe('1/4')
        expect(crLabel(0.5)).toBe('1/2')
        expect(crLabel(0)).toBe('0')
        expect(crLabel(10)).toBe('10')
    })
})

describe('abilityMod / fmtMod', () => {
    it('calcula el modificador 5e', () => {
        expect(abilityMod(10)).toBe(0)
        expect(abilityMod(15)).toBe(2)
        expect(abilityMod(8)).toBe(-1)
        expect(abilityMod(1)).toBe(-5)
    })
    it('formatea con signo', () => {
        expect(fmtMod(2)).toBe('+2')
        expect(fmtMod(0)).toBe('+0')
        expect(fmtMod(-1)).toBe('-1')
    })
})
