import type { Scene } from './scene'
import type { Session } from './session'
import type { Playlist } from './music'
import type { CampaignMapData, MapLibraryEntry } from './map'
import type { Encounter } from './encounter'
import type { PlayerScreenImage } from './playerScreen'

export interface Campaign {
    id: string
    name: string
    scenes: Scene[]
    sessions: Session[]
    playlists: Playlist[]
    map?: CampaignMapData
    encounters?: Encounter[]
    activeEncounterId?: string
    playerScreenImages?: PlayerScreenImage[]
    mapLibrary?: MapLibraryEntry[]
    activeMapStoredId?: string | null
    activeMapRotation?: 0 | 90
}
