export interface Sound {
    id: string
    name: string
    storedId: string            // user: id en userData/audio · builtin: nombre de archivo en resources/sounds
    type: 'oneshot' | 'ambient'
    categoryId: string          // builtin: '' (agrupan bajo "Starter")
    icon?: string               // clave en SOUND_ICONS
    color?: string              // clave en SOUND_COLORS
    tags?: string[]
    builtin?: boolean           // true solo para sonidos del manifest; nunca persistido
}

export interface SoundCategory {
    id: string
    name: string
    order: number
}
