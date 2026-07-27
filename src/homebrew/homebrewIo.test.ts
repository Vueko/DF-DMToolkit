import { describe, it, expect } from 'vitest'
import { detectImport, normalize5eImport, import5eCollection, importNativeCollection, buildNativeExport, build5eExport } from './homebrewIo'
import { chillbornZombie, adultBronzeDragonXmm } from './fixtures/homebrew5e.fixture'

let n = 0
const makeId = () => `id-${++n}`

describe('detectImport', () => {
    it('5etools por arrays de entidad', () => {
        expect(detectImport({ monster: [] }).kind).toBe('5etools')
        expect(detectImport({ _meta: {}, spell: [{}] }).kind).toBe('5etools')
    })
    it('native por el sobre', () => {
        expect(detectImport({ app: 'dnd5e-toolkit', kind: 'homebrew', monsters: [] }).kind).toBe('native')
    })
    it('invalid', () => {
        expect(detectImport({ nope: 1 }).kind).toBe('invalid')
        expect(detectImport(null).kind).toBe('invalid')
    })
})

describe('normalize5eImport — export de lista (array raíz)', () => {
    it('envuelve criaturas y hereda el source dominante', () => {
        const norm = normalize5eImport([adultBronzeDragonXmm]) as Record<string, unknown>
        expect(detectImport(norm).kind).toBe('5etools')
        expect(Array.isArray(norm.monster)).toBe(true)
        const r = import5eCollection(norm, makeId)
        expect(r.monsters).toHaveLength(1)
        expect(r.collection.name).toBe('XMM')
    })
    it('clasifica conjuros y objetos por campos discriminantes', () => {
        const norm = normalize5eImport([
            { name: 'Fire Bolt', level: 0, school: 'V', source: 'XPHB' },
            { name: 'Bag of Holding', rarity: 'uncommon', source: 'XDMG' },
        ]) as Record<string, unknown>
        expect((norm.spell as unknown[]).length).toBe(1)
        expect((norm.item as unknown[]).length).toBe(1)
    })
    it('array sin entradas reconocibles sigue siendo invalid', () => {
        expect(detectImport(normalize5eImport([{ foo: 1 }]))).toEqual({ kind: 'invalid' })
        expect(detectImport(normalize5eImport([]))).toEqual({ kind: 'invalid' })
    })
    it('objetos raíz pasan sin cambios', () => {
        const obj = { monster: [adultBronzeDragonXmm] }
        expect(normalize5eImport(obj)).toBe(obj)
    })
})

describe('import5eCollection', () => {
    it('convierte monstruos, conjuros y objetos', () => {
        const file = {
            _meta: { sources: [{ full: 'Test Pack', json: 'TP', authors: ['Me'] }] },
            monster: [chillbornZombie],
            spell: [{ name: 'S1', level: 1 }, { name: 'S2', level: 2 }],
            item: [{ name: 'I1', rarity: 'rare' }],
        }
        const out = import5eCollection(file, makeId)
        expect(out.collection.source).toBe('TP')
        expect(out.monsters).toHaveLength(1)
        expect(out.spells).toHaveLength(2)
        expect(out.items).toHaveLength(1)
        expect(out.spells[0].collectionId).toBe(out.collection.id)
        expect(out.spells[0].key.startsWith('hb:')).toBe(true)
        expect(out.items[0].name).toBe('I1')
    })
})

describe('importNativeCollection', () => {
    it('arrastra las tres categorías regenerando keys', () => {
        const file = {
            app: 'dnd5e-toolkit', kind: 'homebrew',
            collection: { name: 'N', source: 'N' },
            monsters: [], spells: [{ key: 'old', name: 'S' }], items: [{ key: 'old2', name: 'I' }],
        }
        const out = importNativeCollection(file, makeId)
        expect(out.spells[0].key.startsWith('hb:')).toBe(true)
        expect(out.spells[0].collectionId).toBe(out.collection.id)
        expect(out.items[0].source).toBe('homebrew')
    })
})

describe('detectImport native con solo spells', () => {
    it('reconoce el sobre native aunque no traiga monsters', () => {
        expect(detectImport({ app: 'dnd5e-toolkit', kind: 'homebrew', spells: [{}] }).kind).toBe('native')
    })
})

describe('export', () => {
    it('native envuelve las tres listas', () => {
        const env = buildNativeExport([], [{ key: 'hb:1', name: 'S' } as never], []) as Record<string, unknown>
        expect(env.app).toBe('dnd5e-toolkit')
        expect(Array.isArray(env.spells)).toBe(true)
    })
    it('5etools produce _meta + monster + spell + item', () => {
        const env = build5eExport([], [], []) as Record<string, unknown>
        expect(env).toHaveProperty('_meta')
        expect(env).toHaveProperty('monster')
        expect(env).toHaveProperty('spell')
        expect(env).toHaveProperty('item')
    })
})
