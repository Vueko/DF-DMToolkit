import type { Sound } from '../types'

const normalize = (s: string): string =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function filterSounds(sounds: Sound[], query: string, activeTags: string[]): Sound[] {
    const q = normalize(query.trim())
    return sounds.filter((s) => {
        if (q && !normalize(s.name).includes(q) && !(s.tags ?? []).some((t) => normalize(t).includes(q))) return false
        if (activeTags.length > 0 && !activeTags.every((t) => (s.tags ?? []).includes(t))) return false
        return true
    })
}

export function allTags(sounds: Sound[]): string[] {
    return [...new Set(sounds.flatMap((s) => s.tags ?? []))].sort()
}
