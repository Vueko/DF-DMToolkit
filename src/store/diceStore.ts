// Historial de tiradas SOLO de sesión: sin persist a propósito (no tocar STORE_KEYS).
import { create } from 'zustand'
import { parseNotation, roll, type RollMode, type RollResult, type RollSpec } from '../dice/roll'

const HISTORY_CAP = 50

interface DiceState {
    history: RollResult[]
    trayOpen: boolean
    mode: RollMode

    rollNotation: (notation: string, opts?: { label?: string; mode?: RollMode }) => RollResult | null
    rollSpec: (spec: RollSpec, label?: string) => RollResult
    logRoll: (result: RollResult) => void
    clearHistory: () => void
    setTrayOpen: (open: boolean) => void
    setMode: (mode: RollMode) => void
}

export const useDiceStore = create<DiceState>()((set, get) => ({
    history: [],
    trayOpen: false,
    mode: 'normal',

    rollSpec: (spec, label) => {
        const result = { ...roll(spec), label }
        get().logRoll(result)
        return result
    },

    rollNotation: (notation, opts = {}) => {
        const spec = parseNotation(notation)
        if (!spec) return null
        return get().rollSpec({ ...spec, mode: opts.mode ?? get().mode }, opts.label)
    },

    logRoll: (result) =>
        set((s) => ({ history: [result, ...s.history].slice(0, HISTORY_CAP) })),

    clearHistory: () => set({ history: [] }),

    // Cerrar resetea el modo: la desventaja de ayer no debe perseguir la tirada de hoy.
    setTrayOpen: (open) => set((s) => ({ trayOpen: open, mode: open ? s.mode : 'normal' })),

    setMode: (mode) => set({ mode }),
}))
