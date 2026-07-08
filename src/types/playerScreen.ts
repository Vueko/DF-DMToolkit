export interface PlayerScreenImage {
    id: string
    name: string
    storedId: string
}

export interface PlayerInitiativeEntry {
    name: string
    active: boolean
    kind: 'pc' | 'enemy'
}

export interface PlayerInitiativePayload {
    round: number
    entries: PlayerInitiativeEntry[]
}
