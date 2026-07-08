import { describe, it, expect } from 'vitest'
import { mergeSupplement } from './mergeSupplement'
import { getSupplement, SUPPLEMENT_ATTRIBUTION } from './supplements'

describe('mergeSupplement', () => {
    it('rellena desc vacío desde el suplemento (match por nombre, case-insensitive)', () => {
        const out = mergeSupplement(
            [{ name: 'Blinded', desc: '' }],
            [{ name: 'blinded', desc: 'No puede ver.' }],
        )
        expect(out).toEqual([{ name: 'Blinded', desc: 'No puede ver.' }])
    })
    it('no pisa un desc no vacío de la API', () => {
        const out = mergeSupplement(
            [{ name: 'Prone', desc: 'texto de la API' }],
            [{ name: 'Prone', desc: 'texto del suplemento' }],
        )
        expect(out[0].desc).toBe('texto de la API')
    })
    it('añade entradas del suplemento que no están en la API', () => {
        const out = mergeSupplement([], [{ name: 'Grappled', desc: 'Velocidad 0.' }])
        expect(out).toEqual([{ name: 'Grappled', desc: 'Velocidad 0.' }])
    })
    it('sin suplemento devuelve las entradas tal cual', () => {
        const entries = [{ name: 'X', desc: 'y' }]
        expect(mergeSupplement(entries, undefined)).toEqual(entries)
    })
    it('preserva otros campos de la entrada de la API al rellenar', () => {
        const out = mergeSupplement(
            [{ name: 'Poisoned', desc: '', key: 'core_poisoned' }],
            [{ name: 'Poisoned', desc: 'Desventaja.' }],
        )
        expect(out[0]).toEqual({ name: 'Poisoned', desc: 'Desventaja.', key: 'core_poisoned' })
    })
})

describe('getSupplement', () => {
    it('trae las condiciones de srd-2024 y las 15 están cubiertas', () => {
        const sup = getSupplement('srd-2024')
        const names = (sup.conditions ?? []).map((c) => c.name).sort()
        expect(names).toEqual([
            'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated',
            'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
        ])
        expect((sup.conditions ?? []).every((c) => c.desc.trim().length > 0)).toBe(true)
    })
    it('srd-2024 trae reglas del glosario y ninguna condición', () => {
        const sup = getSupplement('srd-2024')
        expect((sup.rules ?? []).length).toBeGreaterThan(0)
        const ruleNames = (sup.rules ?? []).map((r) => r.name)
        expect(ruleNames).toContain('Advantage')
        const conditionNames = ['Blinded', 'Grappled', 'Prone', 'Stunned']
        for (const c of conditionNames) expect(ruleNames).not.toContain(c)
        expect((sup.rules ?? []).every((r) => r.desc.trim().length > 0)).toBe(true)
    })
    it('incluye términos del Chunk 2', () => {
        const names = (getSupplement('srd-2024').rules ?? []).map((r) => r.name)
        for (const n of ['Concentration', 'Cover', 'Death Saving Throw', 'Difficult Terrain', 'Disadvantage']) {
            expect(names).toContain(n)
        }
    })
    it('incluye términos del Chunk 3', () => {
        const names = (getSupplement('srd-2024').rules ?? []).map((r) => r.name)
        for (const n of ['Grappling', 'Heroic Inspiration', 'Hit Points', 'Initiative', 'Knocking Out a Creature']) {
            expect(names).toContain(n)
        }
    })
    it('incluye términos del Chunk 4', () => {
        const names = (getSupplement('srd-2024').rules ?? []).map((r) => r.name)
        for (const n of ['Long Rest', 'Opportunity Attacks', 'Passive Perception', 'Reach', 'Saving Throw']) {
            expect(names).toContain(n)
        }
    })
    it('incluye términos del Chunk 5', () => {
        const names = (getSupplement('srd-2024').rules ?? []).map((r) => r.name)
        for (const n of ['Short Rest', 'Temporary Hit Points', 'Unarmed Strike', 'Truesight', 'Weapon Attack']) {
            expect(names).toContain(n)
        }
    })
    it('el glosario de reglas está completo (~150, sin condiciones, sin duplicados)', () => {
        const rules = getSupplement('srd-2024').rules ?? []
        expect(rules.length).toBeGreaterThanOrEqual(148)
        const names = rules.map((r) => r.name)
        expect(new Set(names).size).toBe(names.length) // sin nombres duplicados
        const conditions = ['Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious']
        for (const c of conditions) expect(names).not.toContain(c)
        expect(rules.every((r) => r.desc.trim().length > 0)).toBe(true)
    })
    it('versión desconocida → suplemento vacío', () => {
        expect(getSupplement('nope')).toEqual({})
    })
    it('expone la atribución CC-BY', () => {
        expect(SUPPLEMENT_ATTRIBUTION).toMatch(/CC-BY/)
    })
})
