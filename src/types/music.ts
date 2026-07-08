export interface Track {
    id: string
    title: string
    artist: string
    storedId: string
    duration?: number
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

export interface Playlist {
    id: string
    name: string
    tracks: Track[]
}
