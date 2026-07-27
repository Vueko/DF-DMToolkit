import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import type { Campaign } from '../types'
import type { CampaignState, CampaignSet, CampaignGet } from '../store/campaign/types'

// Ver comentario detallado en SceneWidget.test.tsx / SoundsSection.test.tsx / DiceTray.test.tsx:
// `useCampaignStore` es un store zustand con `persist` cuyo `getInitialState()` queda congelado
// para siempre en el estado de creación, así que un `setState()` posterior no se refleja en un
// componente renderizado vía `renderToStaticMarkup`. Se reconstruye aquí con las MISMAS slice
// factories de producción sobre un set/get propio sin `persist` ni `useSyncExternalStore`.
vi.mock('../store/campaignStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../store/campaignStore')>()
    const { createCampaignsSlice } = await import('../store/campaign/slices/campaigns')
    const { createSessionsSlice } = await import('../store/campaign/slices/sessions')
    const { createSessionItemsSlice } = await import('../store/campaign/slices/sessionItems')
    const { createScenesSlice } = await import('../store/campaign/slices/scenes')
    const { createPlaylistsSlice } = await import('../store/campaign/slices/playlists')
    const { createMapSlice } = await import('../store/campaign/slices/map')
    const { createEncountersSlice } = await import('../store/campaign/slices/encounters')
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

const { useCampaignStore } = await import('../store/campaignStore')
const SceneTracker = (await import('./SceneTracker')).default

const campaign = (): Campaign => ({
    id: 'c1',
    name: 'C',
    scenes: [{ id: 'sc1', title: 'The drowned altar', status: 'upcoming', flag: '', count: 0 }],
    sessions: [{
        id: 's1', name: 'Session 1', number: 1, sceneIds: ['sc1'], encounterIds: [],
        items: [{ id: 'i1', kind: 'clue', title: 'Altar carving names Vol', done: false }],
    }],
    playlists: [],
})

beforeEach(() => {
    useCampaignStore.setState({ campaigns: [campaign()], currentCampaignId: 'c1', currentSessionId: 's1' })
})

describe('SceneTracker', () => {
    it('muestra el título relabelado «Session Log» y la sección de escenas unificada', () => {
        // `selectedSessionId` es un useState local que arranca en 'all' (no deriva de
        // `currentSessionId`), y `renderToStaticMarkup` no puede simular el click en la sesión
        // de la sidebar — por eso el render de `SessionItemSections` para una sesión concreta
        // está cubierto en `SessionItemSections.test.tsx` (Task 6). Aquí verificamos que la
        // página monta sin excepciones tras la unificación, conserva el relabel y renderiza las
        // escenas como una sección del registro (la tarjeta de escena aparece en la vista 'all').
        const html = renderToStaticMarkup(<MemoryRouter><SceneTracker /></MemoryRouter>)
        expect(html).toContain('Session Log')
        expect(html).toContain('The drowned altar')
    })
})
