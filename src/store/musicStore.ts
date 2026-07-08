import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'

interface MusicState {
    currentTrackIndex: number
    isPlaying: boolean
    volume: number
    loop: boolean
    shuffle: boolean
    activePlaylistId: string | null

    setCurrentTrackIndex: (index: number) => void
    togglePlay: () => void
    setIsPlaying: (val: boolean) => void
    setVolume: (vol: number) => void
    next: (playlistLength: number) => void
    prev: (playlistLength: number) => void
    toggleLoop: () => void
    toggleShuffle: () => void
    setActivePlaylistId: (id: string | null) => void
}

export const useMusicStore = create<MusicState>()(
    persist(
        (set, get) => ({
            currentTrackIndex: 0,
            isPlaying: false,
            volume: 0.75,
            loop: false,
            shuffle: false,
            activePlaylistId: null,

            setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
            togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
            setIsPlaying: (val) => set({ isPlaying: val }),
            setVolume: (vol) => set({ volume: vol }),
            toggleLoop: () => set((s) => ({ loop: !s.loop })),
            toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),

            next: (playlistLength) => {
                const { currentTrackIndex, shuffle } = get()
                if (playlistLength === 0) return
                const next = shuffle
                    ? Math.floor(Math.random() * playlistLength)
                    : (currentTrackIndex + 1) % playlistLength
                set({ currentTrackIndex: next })
            },

            prev: (playlistLength) => {
                const { currentTrackIndex } = get()
                if (playlistLength === 0) return
                const prev = (currentTrackIndex - 1 + playlistLength) % playlistLength
                set({ currentTrackIndex: prev })
            },

            setActivePlaylistId: (id) => set({ activePlaylistId: id, currentTrackIndex: 0 }),
        }),
        {
            name: 'dnd-music',
            version: 1,
            migrate: createMigrate<MusicState>(1, {}),
            storage: createJSONStorage(() => electronStorage),
            partialize: (s) => ({ volume: s.volume, loop: s.loop, shuffle: s.shuffle, activePlaylistId: s.activePlaylistId }),
        }
    )
)