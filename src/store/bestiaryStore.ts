import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { Monster } from '../types'

interface BestiaryState {
    monsters: Monster[]           // solo homebrew; los SRD viven en la caché
    addMonster: (monster: Monster) => void
    addMonsters: (monsters: Monster[]) => void
    updateMonster: (id: string, updates: Partial<Monster>) => void
    removeMonster: (id: string) => void
    removeByCollection: (collectionId: string) => void
}

export const useBestiaryStore = create<BestiaryState>()(
    persist(
        (set) => ({
            monsters: [],
            addMonster: (monster) => set((s) => ({ monsters: [...s.monsters, monster] })),
            addMonsters: (monsters) => set((s) => ({ monsters: [...s.monsters, ...monsters] })),
            updateMonster: (id, updates) => set((s) => ({
                monsters: s.monsters.map((m) => (m.id === id ? { ...m, ...updates } : m)),
            })),
            removeMonster: (id) => set((s) => ({ monsters: s.monsters.filter((m) => m.id !== id) })),
            removeByCollection: (collectionId) => set((s) => ({
                monsters: s.monsters.filter((m) => m.collectionId !== collectionId),
            })),
        }),
        { name: 'dnd-bestiary', version: 1, migrate: createMigrate<BestiaryState>(1, {}), storage: createJSONStorage(() => electronStorage) }
    )
)
