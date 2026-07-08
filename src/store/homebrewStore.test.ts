import { describe, it, expect, beforeEach } from 'vitest'
import { useHomebrewStore, collectionEnabled, migrateHomebrewV1toV2 } from './homebrewStore'
import type { HomebrewCollection, Spell, MagicItem } from '../types'

const get = () => useHomebrewStore.getState()
const mk = (id: string, over: Partial<HomebrewCollection> = {}): HomebrewCollection =>
    ({ id, name: id, source: id.toUpperCase(), enabled: true, addedAt: 'x', ...over })
const spell = (id: string, collectionId?: string): Spell => ({
    key: id, name: id, level: 1, school: '', castingTime: '', range: '', components: '',
    duration: '', concentration: false, ritual: false, desc: '', classes: [], source: 'homebrew', collectionId,
})
const item = (id: string, collectionId?: string): MagicItem => ({
    key: id, name: id, type: '', rarity: '', requiresAttunement: false, attunementDetail: null,
    desc: '', source: 'homebrew', collectionId,
})

beforeEach(() => useHomebrewStore.setState({ collections: [], spells: [], items: [] }))

describe('homebrewStore', () => {
    it('add/remove/toggle', () => {
        get().addCollection(mk('a'))
        expect(get().collections.map((c) => c.id)).toEqual(['a'])
        get().toggleCollection('a')
        expect(get().collections[0].enabled).toBe(false)
        get().removeCollection('a')
        expect(get().collections).toEqual([])
    })
    it('collectionEnabled: sin colección o habilitada → true; deshabilitada → false', () => {
        get().addCollection(mk('a', { enabled: false }))
        get().addCollection(mk('b'))
        expect(collectionEnabled(get(), undefined)).toBe(true)
        expect(collectionEnabled(get(), 'a')).toBe(false)
        expect(collectionEnabled(get(), 'b')).toBe(true)
        expect(collectionEnabled(get(), 'missing')).toBe(true)
    })
})

describe('homebrewStore spells/items', () => {
    it('addSpells / addItems acumulan', () => {
        get().addSpells([spell('a'), spell('b')])
        get().addItems([item('x')])
        expect(get().spells).toHaveLength(2)
        expect(get().items).toHaveLength(1)
    })
    it('removeCollection borra colección + sus spells/items', () => {
        useHomebrewStore.setState({
            collections: [{ id: 'c1', name: 'C1', source: 'C1', enabled: true, addedAt: 'x' }],
            spells: [spell('a', 'c1'), spell('b', 'c2')],
            items: [item('x', 'c1')],
        })
        get().removeCollection('c1')
        expect(get().collections).toHaveLength(0)
        expect(get().spells.map((s) => s.key)).toEqual(['b'])
        expect(get().items).toHaveLength(0)
    })
})

describe('migrateHomebrewV1toV2', () => {
    it('añade spells/items vacíos si faltan', () => {
        const out = migrateHomebrewV1toV2({ collections: [] }) as { spells: unknown[]; items: unknown[] }
        expect(out.spells).toEqual([])
        expect(out.items).toEqual([])
    })
})
