import { describe, it, expect } from 'vitest'
import {
    XP_BUDGET_PER_CHARACTER, DIFFICULTIES,
    xpBudget, encounterXpTotal, resultingDifficulty, partyToGroups,
} from './encounterXp'

describe('XP_BUDGET_PER_CHARACTER (DMG 2024)', () => {
    it('valores de referencia del manual', () => {
        expect(XP_BUDGET_PER_CHARACTER[1]).toEqual({ low: 50, moderate: 75, high: 100 })
        expect(XP_BUDGET_PER_CHARACTER[3]).toEqual({ low: 150, moderate: 225, high: 400 })
        expect(XP_BUDGET_PER_CHARACTER[5]).toEqual({ low: 500, moderate: 750, high: 1100 })
        expect(XP_BUDGET_PER_CHARACTER[20]).toEqual({ low: 6400, moderate: 11500, high: 22000 })
    })
    it('cubre los 20 niveles con las tres dificultades', () => {
        for (let lvl = 1; lvl <= 20; lvl++) {
            for (const d of DIFFICULTIES) {
                expect(XP_BUDGET_PER_CHARACTER[lvl][d]).toBeGreaterThan(0)
            }
        }
    })
})

describe('xpBudget', () => {
    it('presupuesto = por-PC × cantidad (ejemplo DMG: 4 PJs nivel 3, Moderate = 900)', () => {
        expect(xpBudget([{ level: 3, count: 4 }], 'moderate')).toBe(900)
    })
    it('suma grupos de niveles distintos', () => {
        // 3 de nivel 5 (500) + 1 de nivel 4 (250) a Low = 1750
        expect(xpBudget([{ level: 5, count: 3 }, { level: 4, count: 1 }], 'low')).toBe(1750)
    })
    it('clampa niveles fuera de tabla', () => {
        expect(xpBudget([{ level: 0, count: 1 }], 'low')).toBe(50)      // → nivel 1
        expect(xpBudget([{ level: 25, count: 1 }], 'high')).toBe(22000) // → nivel 20
    })
    it('party vacío → 0', () => {
        expect(xpBudget([], 'high')).toBe(0)
    })
})

describe('encounterXpTotal', () => {
    const xpById = new Map([['srd:goblin', 50], ['hb:boss', 5900]])
    it('suma directa XP × cantidad, sin multiplicador', () => {
        expect(encounterXpTotal([
            { monsterId: 'srd:goblin', count: 8 },
            { monsterId: 'hb:boss', count: 1 },
        ], xpById)).toBe(8 * 50 + 5900)
    })
    it('monstruo desconocido cuenta 0', () => {
        expect(encounterXpTotal([{ monsterId: 'missing', count: 3 }], xpById)).toBe(0)
    })
})

describe('partyToGroups', () => {
    it('agrupa PCs por nivel, ordenado ascendente', () => {
        expect(partyToGroups([{ level: 3 }, { level: 3 }, { level: 5 }, { level: 3 }])).toEqual([
            { level: 3, count: 3 }, { level: 5, count: 1 },
        ])
    })
    it('nivel ausente → 1; clampa fuera de rango', () => {
        expect(partyToGroups([{}, { level: 0 }, { level: 25 }])).toEqual([
            { level: 1, count: 2 }, { level: 20, count: 1 },
        ])
    })
    it('party vacío → []', () => {
        expect(partyToGroups([])).toEqual([])
    })
})

describe('resultingDifficulty', () => {
    const party = [{ level: 3, count: 4 }] // low 600 · moderate 900 · high 1600
    it('por debajo de Low es trivial', () => {
        expect(resultingDifficulty(599, party)).toBe('trivial')
    })
    it('umbrales inclusivos por tramo', () => {
        expect(resultingDifficulty(600, party)).toBe('low')
        expect(resultingDifficulty(899, party)).toBe('low')
        expect(resultingDifficulty(900, party)).toBe('moderate')
        expect(resultingDifficulty(1600, party)).toBe('high')
        expect(resultingDifficulty(99999, party)).toBe('high')
    })
    it('sin party todo es trivial', () => {
        expect(resultingDifficulty(1000, [])).toBe('trivial')
    })
})
