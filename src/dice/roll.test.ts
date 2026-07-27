import { describe, it, expect } from 'vitest'
import { parseNotation, roll, formatSpec, critNotation, d20RollResult } from './roll'

// rng con secuencia fija: cada llamada devuelve el siguiente valor (0 ≤ v < 1)
const seq = (...values: number[]) => {
    let i = 0
    return () => values[i++ % values.length]
}
// valor de rng que produce exactamente `die` en un dado de `sides`
const forDie = (die: number, sides: number) => (die - 1) / sides + 0.0001

describe('parseNotation', () => {
    it('acepta la gramática 5e-standard', () => {
        expect(parseNotation('d20')).toEqual({ terms: [{ count: 1, sides: 20, keep: undefined, sign: 1 }], mode: 'normal' })
        expect(parseNotation('2d6+3')).toEqual({
            terms: [{ count: 2, sides: 6, keep: undefined, sign: 1 }, 3], mode: 'normal',
        })
        expect(parseNotation('4d6kh3')).toEqual({
            terms: [{ count: 4, sides: 6, keep: { mode: 'h', count: 3 }, sign: 1 }], mode: 'normal',
        })
        expect(parseNotation('d20-1')).toEqual({
            terms: [{ count: 1, sides: 20, keep: undefined, sign: 1 }, -1], mode: 'normal',
        })
        expect(parseNotation(' 2D6 + 1d4 + 3 ')?.terms).toHaveLength(3)
    })
    it('rechaza entradas inválidas y fuera de límites', () => {
        for (const bad of ['', 'abc', 'd', '0d6', 'd1', '41d6', '2d1001', '2d6kh3', '4d6kh0', '1d6k3', '2d6++3', '+']) {
            expect(parseNotation(bad), bad).toBeNull()
        }
    })
})

describe('roll', () => {
    it('suma términos y modificadores', () => {
        const spec = parseNotation('2d6+3')!
        const r = roll(spec, seq(forDie(4, 6), forDie(2, 6)))
        expect(r.terms[0].rolls).toEqual([4, 2])
        expect(r.terms[0].subtotal).toBe(6)
        expect(r.terms[1].subtotal).toBe(3)
        expect(r.total).toBe(9)
    })
    it('kh conserva los más altos y marca descartados', () => {
        const r = roll(parseNotation('4d6kh3')!, seq(forDie(6, 6), forDie(1, 6), forDie(5, 6), forDie(3, 6)))
        expect(r.terms[0].rolls).toEqual([6, 1, 5, 3])
        expect(r.terms[0].kept).toEqual([true, false, true, true])
        expect(r.total).toBe(14)
    })
    it('término negativo resta', () => {
        const r = roll(parseNotation('d20-2')!, seq(forDie(10, 20)))
        expect(r.total).toBe(8)
    })
    it('advantage tira 2d20 y conserva el mayor; disadvantage el menor', () => {
        const adv = roll({ ...parseNotation('d20+7')!, mode: 'advantage' }, seq(forDie(4, 20), forDie(17, 20)))
        expect(adv.terms[0].rolls).toEqual([4, 17])
        expect(adv.total).toBe(24)
        expect(adv.d20).toEqual({ natural: 17, crit: null })
        const dis = roll({ ...parseNotation('d20+7')!, mode: 'disadvantage' }, seq(forDie(4, 20), forDie(17, 20)))
        expect(dis.total).toBe(11)
    })
    it('mode se ignora si el primer término no es 1d20 plano', () => {
        const r = roll({ ...parseNotation('2d6+3')!, mode: 'advantage' }, seq(forDie(1, 6), forDie(1, 6)))
        expect(r.terms[0].rolls).toHaveLength(2)
        expect(r.total).toBe(5)
    })
    it('detecta crit 20 y pifia 1', () => {
        expect(roll(parseNotation('d20+5')!, seq(forDie(20, 20))).d20).toEqual({ natural: 20, crit: 20 })
        expect(roll(parseNotation('d20+5')!, seq(forDie(1, 20))).d20).toEqual({ natural: 1, crit: 1 })
        expect(roll(parseNotation('2d6')!, seq(forDie(3, 6), forDie(3, 6))).d20).toBeUndefined()
    })
    it('notation es la forma canónica del spec original (no expandido por adv)', () => {
        const r = roll({ ...parseNotation('d20+7')!, mode: 'advantage' }, seq(forDie(4, 20), forDie(17, 20)))
        expect(r.notation).toBe('1d20+7')
        expect(r.mode).toBe('advantage')
    })
})

describe('formatSpec / critNotation / d20RollResult', () => {
    it('formatSpec produce forma canónica', () => {
        expect(formatSpec(parseNotation('d20 - 1')!)).toBe('1d20-1')
        expect(formatSpec(parseNotation('4d6kh3+2')!)).toBe('4d6kh3+2')
    })
    it('critNotation duplica dados y respeta modificadores', () => {
        expect(critNotation('2d6+4')).toBe('4d6+4')
        expect(critNotation('1d8')).toBe('2d8')
        expect(critNotation('garbage')).toBeNull()
    })
    it('d20RollResult construye el resultado sin re-tirar', () => {
        const r = d20RollResult(11, 3, 'Initiative · Wolf')
        expect(r.total).toBe(14)
        expect(r.notation).toBe('1d20+3')
        expect(r.label).toBe('Initiative · Wolf')
        expect(r.d20).toEqual({ natural: 11, crit: null })
        expect(d20RollResult(9, 0, 'x').notation).toBe('1d20')
        expect(d20RollResult(9, -1, 'x').notation).toBe('1d20-1')
    })
})
