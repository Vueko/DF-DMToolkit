import { create } from 'zustand'

export type UpdaterEvent =
    | { type: 'checking' }
    | { type: 'available'; version: string }
    | { type: 'not-available' }
    | { type: 'progress'; percent: number }
    | { type: 'downloaded'; version: string }
    | { type: 'error'; message: string }

export type UpdateStatus =
    | 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

export interface UpdateState {
    status: UpdateStatus
    version: string | null
    percent: number
    error: string | null
    dismissed: boolean
}

export const initialUpdateState: UpdateState = {
    status: 'idle', version: null, percent: 0, error: null, dismissed: false,
}

export function reduceUpdate(state: UpdateState, ev: UpdaterEvent): UpdateState {
    switch (ev.type) {
        case 'checking':
            return { ...state, status: 'checking', error: null, dismissed: false }
        case 'available':
            return { ...state, status: 'available', version: ev.version, error: null, dismissed: false }
        case 'not-available':
            return { ...state, status: 'not-available', error: null }
        case 'progress':
            return { ...state, status: 'downloading', percent: ev.percent }
        case 'downloaded':
            return { ...state, status: 'downloaded', version: ev.version, percent: 100, dismissed: false }
        case 'error':
            return { ...state, status: 'error', error: ev.message }
        default:
            return state
    }
}

interface UpdateStore extends UpdateState {
    apply: (ev: UpdaterEvent) => void
    dismiss: () => void
}

export const useUpdateStore = create<UpdateStore>((set) => ({
    ...initialUpdateState,
    apply: (ev) => set((state) => reduceUpdate(state, ev)),
    dismiss: () => set({ dismissed: true }),
}))
