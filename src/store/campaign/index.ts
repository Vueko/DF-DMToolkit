import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../../utils/electronStorage'
import { createMigrate } from '../persistMigration'
import type { CampaignState } from './types'
import { createCampaignsSlice } from './slices/campaigns'
import { createSessionsSlice } from './slices/sessions'
import { createSessionItemsSlice } from './slices/sessionItems'
import { createScenesSlice } from './slices/scenes'
import { createPlaylistsSlice } from './slices/playlists'
import { createMapSlice } from './slices/map'
import { createEncountersSlice } from './slices/encounters'

// v1 (Daggerheart) → v2 (D&D 5e): fuera cardInstances, encounters con la forma
// antigua (battle points) y los campos fear de las escenas. Exportada para tests.
export function migrateCampaignsV1toV2(state: unknown): unknown {
    if (!state || typeof state !== 'object') return state
    const s = state as Record<string, unknown>
    if (!Array.isArray(s.campaigns)) return state
    const campaigns = s.campaigns.map((c) => {
        if (!c || typeof c !== 'object') return c
        const camp = { ...(c as Record<string, unknown>) }
        delete camp.encounters
        delete camp.activeEncounterId
        if (Array.isArray(camp.sessions)) {
            camp.sessions = camp.sessions.map((sess) => {
                if (!sess || typeof sess !== 'object') return sess
                const s2: Record<string, unknown> = { ...(sess as Record<string, unknown>), encounterIds: [] }
                delete s2.cardInstances
                return s2
            })
        }
        if (Array.isArray(camp.scenes)) {
            camp.scenes = camp.scenes.map((sc) => {
                if (!sc || typeof sc !== 'object') return sc
                const s3 = { ...(sc as Record<string, unknown>) }
                if (s3.flagType === 'fear') s3.flagType = 'event'
                delete s3.fearThreshold
                return s3
            })
        }
        return camp
    })
    return { ...s, campaigns }
}

export const useCampaignStore = create<CampaignState>()(
    persist(
        (set, get) => ({
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
        }),
        { name: 'dnd-campaigns', version: 2, migrate: createMigrate<CampaignState>(2, { 2: migrateCampaignsV1toV2 }), storage: createJSONStorage(() => electronStorage) }
    )
)

export type { CampaignState } from './types'
