export interface Sound {
    id: string
    name: string
    storedId: string
    type: 'oneshot' | 'ambient'
    categoryId: string
    mood?: 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'
}

export interface SoundCategory {
    id: string
    name: string
    order: number
}
