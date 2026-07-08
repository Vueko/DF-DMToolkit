import { create } from 'zustand'
import type { VaultNode } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { buildNoteIndex, buildImageIndex, listNotes, resolveNote, type NoteRef } from './wikilinks'

interface VaultState {
    tree: VaultNode | null
    notes: NoteRef[]
    noteIndex: Map<string, string>
    imageIndex: Map<string, string>
    status: 'empty' | 'loading' | 'ready' | 'error'
    load: () => Promise<void>
    reload: () => Promise<void>
    pickVault: () => Promise<void>
    resolve: (name: string) => string | null
}

export const useVaultStore = create<VaultState>((set, get) => ({
    tree: null,
    notes: [],
    noteIndex: new Map(),
    imageIndex: new Map(),
    status: 'empty',

    load: async () => {
        const path = useSettingsStore.getState().vaultPath
        if (!path) {
            set({ status: 'empty', tree: null, notes: [], noteIndex: new Map(), imageIndex: new Map() })
            return
        }
        set({ status: 'loading' })
        const tree = await window.electron.vault.readTree(path)
        if (!tree) {
            set({ status: 'error', tree: null, notes: [], noteIndex: new Map(), imageIndex: new Map() })
            return
        }
        const notes = listNotes(tree)
        const noteIndex = buildNoteIndex(tree)
        const imageIndex = buildImageIndex(tree)
        if (import.meta.env.DEV) {
            console.log(
                `[vault] indexed ${notes.length} notes, ${imageIndex.size} images.`,
                'image keys (first 20):', [...imageIndex.keys()].slice(0, 20),
            )
        }
        set({ tree, notes, noteIndex, imageIndex, status: 'ready' })
    },

    reload: async () => { await get().load() },

    pickVault: async () => {
        const picked = await window.electron.vault.pickFolder()
        if (!picked) return
        useSettingsStore.getState().setVaultPath(picked)
        await get().load()
    },

    resolve: (name) => resolveNote(get().noteIndex, name),
}))
