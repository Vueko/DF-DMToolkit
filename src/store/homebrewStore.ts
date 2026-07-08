import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { HomebrewCollection, Spell, MagicItem } from '../types'

interface HomebrewState {
    collections: HomebrewCollection[]
    spells: Spell[]
    items: MagicItem[]
    addCollection: (collection: HomebrewCollection) => void
    removeCollection: (id: string) => void
    toggleCollection: (id: string) => void
    addSpells: (spells: Spell[]) => void
    addItems: (items: MagicItem[]) => void
}

// true si la entidad no pertenece a colección alguna o su colección está activa.
export const collectionEnabled = (
    state: Pick<HomebrewState, 'collections'>,
    id: string | undefined,
): boolean => (!id ? true : state.collections.find((c) => c.id === id)?.enabled ?? true)

// v1 (solo collections) → v2 (+ spells/items). Exportada para tests.
export function migrateHomebrewV1toV2(state: unknown): unknown {
    const s = (state && typeof state === 'object' ? { ...(state as Record<string, unknown>) } : {}) as Record<string, unknown>
    return { ...s, spells: Array.isArray(s.spells) ? s.spells : [], items: Array.isArray(s.items) ? s.items : [] }
}

export const useHomebrewStore = create<HomebrewState>()(
    persist(
        (set) => ({
            collections: [],
            spells: [],
            items: [],
            addCollection: (collection) => set((s) => ({ collections: [...s.collections, collection] })),
            removeCollection: (id) => set((s) => ({
                collections: s.collections.filter((c) => c.id !== id),
                spells: s.spells.filter((sp) => sp.collectionId !== id),
                items: s.items.filter((it) => it.collectionId !== id),
            })),
            toggleCollection: (id) => set((s) => ({
                collections: s.collections.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
            })),
            addSpells: (spells) => set((s) => ({ spells: [...s.spells, ...spells] })),
            addItems: (items) => set((s) => ({ items: [...s.items, ...items] })),
        }),
        {
            name: 'dnd-homebrew',
            version: 2,
            migrate: createMigrate<HomebrewState>(2, { 2: migrateHomebrewV1toV2 }),
            storage: createJSONStorage(() => electronStorage),
        }
    )
)
