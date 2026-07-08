import type { StoreApi } from 'zustand'
import type {
    Campaign, Session, Scene, Track, Playlist,
    CampaignMapData, Encounter, PlayerScreenImage, MapLibraryEntry,
} from '../../types'

export interface CampaignState {
    campaigns: Campaign[]
    currentCampaignId: string | null
    currentSessionId: string | null

    addCampaign: (campaign: Campaign) => void
    removeCampaign: (id: string) => void
    setCurrentCampaign: (id: string) => void

    addSession: (campaignId: string, session: Session) => void
    removeSession: (campaignId: string, sessionId: string) => void
    setCurrentSession: (campaignId: string, sessionId: string) => void
    addSceneToSession: (campaignId: string, sessionId: string, sceneId: string) => void
    removeSceneFromSession: (campaignId: string, sessionId: string, sceneId: string) => void
    addEncounterToSession: (campaignId: string, sessionId: string, encounterId: string) => void
    removeEncounterFromSession: (campaignId: string, sessionId: string, encounterId: string) => void

    addScene: (campaignId: string, scene: Scene) => void
    updateScene: (campaignId: string, sceneId: string, updates: Partial<Scene>) => void
    removeScene: (campaignId: string, sceneId: string) => void

    addPlaylist: (campaignId: string, playlist: Playlist) => void
    removePlaylist: (campaignId: string, playlistId: string) => void
    renamePlaylist: (campaignId: string, playlistId: string, name: string) => void
    addTrackToPlaylist: (campaignId: string, playlistId: string, track: Track) => void
    removeTrackFromPlaylist: (campaignId: string, playlistId: string, trackId: string) => void
    reorderTracksInPlaylist: (campaignId: string, playlistId: string, tracks: Track[]) => void
    updateTrackInPlaylist: (campaignId: string, playlistId: string, trackId: string, updates: Partial<Track>) => void

    updateCampaignMap: (campaignId: string, map: Partial<CampaignMapData>) => void
    setActiveMap: (campaignId: string, storedId: string | null) => void
    addMapLibraryEntry: (campaignId: string, entry: MapLibraryEntry) => void
    removeMapLibraryEntry: (campaignId: string, entryId: string) => void
    setActiveMapRotation: (campaignId: string, rotation: 0 | 90) => void
    addPlayerScreenImage: (campaignId: string, image: PlayerScreenImage) => void
    removePlayerScreenImage: (campaignId: string, imageId: string) => void

    addEncounter: (campaignId: string, encounter: Encounter) => void
    removeEncounter: (campaignId: string, encounterId: string) => void
    updateEncounter: (campaignId: string, encounterId: string, updates: Partial<Encounter>) => void
    setActiveEncounter: (campaignId: string, encounterId: string | null) => void
}

export type CampaignSet = StoreApi<CampaignState>['setState']
export type CampaignGet = StoreApi<CampaignState>['getState']
export type CampaignSlice<A> = (set: CampaignSet, get: CampaignGet) => A
