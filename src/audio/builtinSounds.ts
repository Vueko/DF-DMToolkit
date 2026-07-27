export interface BuiltinSoundDef {
    id: string
    file: string
    nameKey: string
    type: 'oneshot' | 'ambient'
    icon: string
    tags: string[]
}

export const BUILTIN_FILE_RE = /^[a-z0-9-]+\.(ogg|mp3)$/

export const BUILTIN_SOUNDS: BuiltinSoundDef[] = [
    { id: 'builtin-rain', file: 'rain.ogg', nameKey: 'audio.builtin.rain', type: 'ambient', icon: 'rain', tags: ['weather'] },
    { id: 'builtin-thunderstorm', file: 'thunderstorm.ogg', nameKey: 'audio.builtin.thunderstorm', type: 'ambient', icon: 'thunder', tags: ['weather'] },
    { id: 'builtin-snowstorm', file: 'snowstorm.ogg', nameKey: 'audio.builtin.snowstorm', type: 'ambient', icon: 'snow', tags: ['weather'] },
    { id: 'builtin-tavern', file: 'tavern.ogg', nameKey: 'audio.builtin.tavern', type: 'ambient', icon: 'tavern', tags: ['town'] },
    { id: 'builtin-forest', file: 'forest.ogg', nameKey: 'audio.builtin.forest', type: 'ambient', icon: 'forest', tags: ['nature'] },
    { id: 'builtin-cave', file: 'cave.ogg', nameKey: 'audio.builtin.cave', type: 'ambient', icon: 'cave', tags: ['dungeon'] },
    { id: 'builtin-campfire', file: 'campfire.ogg', nameKey: 'audio.builtin.campfire', type: 'ambient', icon: 'fire', tags: ['nature'] },
    { id: 'builtin-dungeon-drone', file: 'dungeon-drone.ogg', nameKey: 'audio.builtin.dungeonDrone', type: 'ambient', icon: 'skull', tags: ['dungeon'] },
]
