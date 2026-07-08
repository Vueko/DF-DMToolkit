export type SceneFlagType = 'event' | 'time' | 'decision'

export interface Scene {
    id: string
    title: string
    status: 'upcoming' | 'active' | 'completed'
    flag: string
    flagType?: SceneFlagType
    count: number
    countMax?: number
    description?: string
    readAloud?: string          // texto para leer a los jugadores
    encounterId?: string        // encuentro vinculado, lanzable a iniciativa
}
