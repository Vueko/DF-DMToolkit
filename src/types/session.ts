import type { SessionItem } from './sessionItem'

export interface Session {
    id: string
    name: string
    number: number
    sceneIds: string[]
    encounterIds: string[]
    items?: SessionItem[]
}
