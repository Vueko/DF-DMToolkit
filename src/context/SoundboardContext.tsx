import { createContext, useContext, useMemo, useRef } from 'react'
import { useSoundboardStore } from '../store/soundboardStore'
import type { Sound } from '../types'

interface SoundboardContextValue {
    toggleAmbient: (sound: Sound) => Promise<void>
    stopAmbient: (soundId: string) => void
    stopAllAmbients: () => void
    playOneshot: (sound: Sound) => Promise<void>
}

const SoundboardContext = createContext<SoundboardContextValue | null>(null)

const resolveSoundData = (sound: Sound): Promise<Uint8Array | null> =>
    sound.builtin
        ? window.electron.fs.getBuiltinAudio(sound.storedId)
        : window.electron.fs.getAudio(sound.storedId)

export function SoundboardProvider({ children }: { children: React.ReactNode }) {
    const ambientRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
    const blobUrlRefs = useRef<Map<string, string>>(new Map())
    const pendingAmbientIds = useRef<Set<string>>(new Set())
    // Selector de la acción (referencia estable): así el Provider NO se re-renderiza
    // cuando cambia activeAmbientIds; las funciones leen el estado vivo con getState().
    const setActiveAmbientIds = useSoundboardStore((s) => s.setActiveAmbientIds)

    const playOneshot = async (sound: Sound): Promise<void> => {
        const data = await resolveSoundData(sound)
        if (!data) return
        const url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
        const audio = new Audio(url)
        audio.addEventListener('ended', () => URL.revokeObjectURL(url))
        audio.play().catch(() => {})
    }

    const toggleAmbient = async (sound: Sound): Promise<void> => {
        const existing = ambientRefs.current.get(sound.id)
        if (existing) {
            existing.pause()
            existing.src = ''
            URL.revokeObjectURL(blobUrlRefs.current.get(sound.id) ?? '')
            blobUrlRefs.current.delete(sound.id)
            ambientRefs.current.delete(sound.id)
            setActiveAmbientIds(
                useSoundboardStore.getState().activeAmbientIds.filter((id) => id !== sound.id)
            )
            return
        }
        if (pendingAmbientIds.current.has(sound.id)) return
        pendingAmbientIds.current.add(sound.id)
        try {
            const data = await resolveSoundData(sound)
            if (!data) return
            const url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
            const audio = new Audio(url)
            audio.loop = true
            audio.play().catch(() => {})
            ambientRefs.current.set(sound.id, audio)
            blobUrlRefs.current.set(sound.id, url)
            setActiveAmbientIds([
                ...useSoundboardStore.getState().activeAmbientIds,
                sound.id,
            ])
        } finally {
            pendingAmbientIds.current.delete(sound.id)
        }
    }

    const stopAmbient = (soundId: string): void => {
        const audio = ambientRefs.current.get(soundId)
        if (audio) {
            audio.pause()
            URL.revokeObjectURL(blobUrlRefs.current.get(soundId) ?? '')
            audio.src = ''
        }
        blobUrlRefs.current.delete(soundId)
        ambientRefs.current.delete(soundId)
        setActiveAmbientIds(
            useSoundboardStore.getState().activeAmbientIds.filter((id) => id !== soundId)
        )
    }

    const stopAllAmbients = (): void => {
        ambientRefs.current.forEach((audio, soundId) => {
            audio.pause()
            URL.revokeObjectURL(blobUrlRefs.current.get(soundId) ?? '')
            audio.src = ''
        })
        ambientRefs.current.clear()
        blobUrlRefs.current.clear()
        setActiveAmbientIds([])
    }

    // Valor estable: las funciones solo cierran sobre refs y la acción estable del store
    // (leen estado vivo con getState()), así que memoizarlo evita re-renderizar a todos
    // los consumidores de useSoundboard en cada cambio del árbol.
    const value = useMemo<SoundboardContextValue>(
        () => ({ toggleAmbient, stopAmbient, stopAllAmbients, playOneshot }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return (
        <SoundboardContext.Provider value={value}>
            {children}
        </SoundboardContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSoundboard(): SoundboardContextValue {
    const ctx = useContext(SoundboardContext)
    if (!ctx) throw new Error('useSoundboard must be used within SoundboardProvider')
    return ctx
}
