import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { Campaign } from '../../types'
import type { CampaignState, CampaignSet, CampaignGet } from '../../store/campaign/types'

// `useCampaignStore` es un store zustand (con `persist`) cuyo `getInitialState()` queda
// congelado para siempre en el estado de creación (ver comentario detallado en
// SoundsSection.test.tsx / DiceTray.test.tsx: React usa ese valor como "server snapshot"
// de `useSyncExternalStore` dentro de `react-dom/server`, así que ningún `setState()`
// posterior se refleja en un componente renderizado vía `renderToStaticMarkup`).
//
// En vez de reimplementar a mano las ~25 acciones del store combinado, se reconstruye
// aquí con las MISMAS slice factories de producción (`createCampaignsSlice`, etc.) sobre
// un `set/get` propio sin `persist` ni `useSyncExternalStore`, así el mock queda anclado
// 1:1 al comportamiento real y cualquier cambio de firma de acción rompe la compilación.
vi.mock('../../store/campaignStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../store/campaignStore')>()
    const { createCampaignsSlice } = await import('../../store/campaign/slices/campaigns')
    const { createSessionsSlice } = await import('../../store/campaign/slices/sessions')
    const { createSessionItemsSlice } = await import('../../store/campaign/slices/sessionItems')
    const { createScenesSlice } = await import('../../store/campaign/slices/scenes')
    const { createPlaylistsSlice } = await import('../../store/campaign/slices/playlists')
    const { createMapSlice } = await import('../../store/campaign/slices/map')
    const { createEncountersSlice } = await import('../../store/campaign/slices/encounters')
    const listeners = new Set<() => void>()
    const notify = () => listeners.forEach((l) => l())

    let state: CampaignState
    const set: CampaignSet = (partial, replace) => {
        const next = typeof partial === 'function'
            ? (partial as (s: CampaignState) => Partial<CampaignState> | CampaignState)(state)
            : partial
        state = replace ? (next as CampaignState) : { ...state, ...next }
        notify()
    }
    const get: CampaignGet = () => state

    state = {
        campaigns: [],
        currentCampaignId: null,
        currentSessionId: null,
        ...createCampaignsSlice(set, get),
        ...createSessionsSlice(set, get),
        ...createSessionItemsSlice(set, get),
        ...createScenesSlice(set, get),
        ...createPlaylistsSlice(set, get),
        ...createMapSlice(set, get),
        ...createEncountersSlice(set, get),
    }

    function useCampaignStore<T = typeof state>(selector?: (s: typeof state) => T): T {
        return (selector ? selector(state) : state) as T
    }
    useCampaignStore.getState = () => state
    useCampaignStore.setState = set
    useCampaignStore.subscribe = (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }

    return { ...actual, useCampaignStore }
})

const { useCampaignStore } = await import('../../store/campaignStore')
const SceneWidget = (await import('./SceneWidget')).default

const campaign = (): Campaign => ({
    id: 'c1',
    name: 'C',
    scenes: [],
    sessions: [{
        id: 's1', name: 'S1', number: 1, sceneIds: [], encounterIds: [],
        items: [{ id: 'i1', kind: 'clue', title: 'Altar carving names Vol', done: false }],
    }],
    playlists: [],
})

beforeEach(() => {
    useCampaignStore.setState({ campaigns: [campaign()], currentCampaignId: 'c1', currentSessionId: 's1' })
})

describe('SceneWidget session items', () => {
    it('rinde la sección de pistas con el ítem de la sesión', () => {
        const html = renderToStaticMarkup(<MemoryRouter><SceneWidget /></MemoryRouter>)
        expect(html).toContain('Clues')
        expect(html).toContain('Altar carving names Vol')
    })
})
