import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import { generateId } from '../utils/generateId'
import type { Sound, SoundCategory } from '../types'

// v1 → v2: mood (campo fijo) pasa a ser un tag; aparece hiddenBuiltinIds.
// OJO: recibe SOLO el subconjunto persistido ({ categories, sounds }).
export function migrateSoundboardV1toV2(state: unknown): unknown {
    const s = (state ?? {}) as { categories?: unknown[]; sounds?: Array<Record<string, unknown>> }
    return {
        ...s,
        sounds: (s.sounds ?? []).map((snd) => {
            const { mood, ...rest } = snd
            return typeof mood === 'string' ? { ...rest, tags: [mood] } : rest
        }),
        hiddenBuiltinIds: [],
    }
}

interface SoundboardState {
    categories: SoundCategory[]
    sounds: Sound[]
    activeAmbientIds: string[]
    hiddenBuiltinIds: string[]

    addCategory: (name: string) => void
    removeCategory: (id: string) => void
    renameCategory: (id: string, name: string) => void
    addSound: (sound: Sound) => void
    removeSound: (id: string) => void
    updateSound: (id: string, updates: Partial<Sound>) => void
    setActiveAmbientIds: (ids: string[]) => void
    hideBuiltin: (id: string) => void
    unhideBuiltin: (id: string) => void
}

export const useSoundboardStore = create<SoundboardState>()(
    persist(
        (set) => ({
            categories: [],
            sounds: [],
            activeAmbientIds: [],
            hiddenBuiltinIds: [],

            addCategory: (name) =>
                set((s) => {
                    const trimmed = name.trim()
                    // No-op ante nombre vacío o duplicado (case-insensitive): evita categorías repetidas.
                    if (!trimmed || s.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
                        return s
                    }
                    return {
                        categories: [
                            ...s.categories,
                            { id: generateId(), name: trimmed, order: s.categories.length },
                        ],
                    }
                }),

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

            hideBuiltin: (id) =>
                set((s) => ({
                    hiddenBuiltinIds: s.hiddenBuiltinIds.includes(id) ? s.hiddenBuiltinIds : [...s.hiddenBuiltinIds, id],
                    activeAmbientIds: s.activeAmbientIds.filter((aid) => aid !== id),
                })),

            unhideBuiltin: (id) =>
                set((s) => ({ hiddenBuiltinIds: s.hiddenBuiltinIds.filter((h) => h !== id) })),
        }),
        {
            name: 'dnd-soundboard',
            version: 2,
            migrate: createMigrate<SoundboardState>(2, { 2: migrateSoundboardV1toV2 }),
            storage: createJSONStorage(() => electronStorage),
            partialize: (s) => ({ categories: s.categories, sounds: s.sounds, hiddenBuiltinIds: s.hiddenBuiltinIds }),
        }
    )
)
