import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import { generateId } from '../utils/generateId'
import type { Sound, SoundCategory } from '../types'

interface SoundboardState {
    categories: SoundCategory[]
    sounds: Sound[]
    activeAmbientIds: string[]

    addCategory: (name: string) => void
    removeCategory: (id: string) => void
    renameCategory: (id: string, name: string) => void
    addSound: (sound: Sound) => void
    removeSound: (id: string) => void
    updateSound: (id: string, updates: Partial<Sound>) => void
    setActiveAmbientIds: (ids: string[]) => void
}

export const useSoundboardStore = create<SoundboardState>()(
    persist(
        (set) => ({
            categories: [],
            sounds: [],
            activeAmbientIds: [],

            addCategory: (name) =>
                set((s) => ({
                    categories: [
                        ...s.categories,
                        { id: generateId(), name, order: s.categories.length },
                    ],
                })),

            removeCategory: (id) =>
                set((s) => ({
                    categories: s.categories.filter((c) => c.id !== id),
                    sounds: s.sounds.filter((snd) => snd.categoryId !== id),
                })),

            renameCategory: (id, name) =>
                set((s) => ({
                    categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)),
                })),

            addSound: (sound) =>
                set((s) => ({ sounds: [...s.sounds, sound] })),

            removeSound: (id) =>
                set((s) => ({
                    sounds: s.sounds.filter((snd) => snd.id !== id),
                    activeAmbientIds: s.activeAmbientIds.filter((aid) => aid !== id),
                })),

            updateSound: (id, updates) =>
                set((s) => ({
                    sounds: s.sounds.map((snd) => (snd.id === id ? { ...snd, ...updates } : snd)),
                })),

            setActiveAmbientIds: (ids) => set({ activeAmbientIds: ids }),
        }),
        {
            name: 'dnd-soundboard',
            version: 1,
            migrate: createMigrate<SoundboardState>(1, {}),
            storage: createJSONStorage(() => electronStorage),
            partialize: (s) => ({ categories: s.categories, sounds: s.sounds }),
        }
    )
)
