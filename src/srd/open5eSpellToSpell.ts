import type { Spell } from '../types'

interface RawObj { [k: string]: unknown }
const str = (v: unknown): string => (typeof v === 'string' ? v : '')
const bool = (v: unknown): boolean => v === true
const num = (v: unknown): number => (typeof v === 'number' ? v : 0)

function components(raw: RawObj): string {
    const parts: string[] = []
    if (bool(raw.verbal)) parts.push('V')
    if (bool(raw.somatic)) parts.push('S')
    if (bool(raw.material)) {
        const detail = str(raw.material_specified)
        parts.push(detail ? `M (${detail})` : 'M')
    }
    return parts.join(', ')
}

export function open5eSpellToSpell(raw: unknown): Spell {
    const o = (raw ?? {}) as RawObj
    const school = o.school as RawObj | undefined
    const classes = Array.isArray(o.classes) ? (o.classes as RawObj[]) : []
    return {
        key: str(o.key),
        name: str(o.name),
        level: num(o.level),
        school: str(school?.name),
        castingTime: str(o.casting_time),
        range: str(o.range_text),
        components: components(o),
        duration: str(o.duration),
        concentration: bool(o.concentration),
        ritual: bool(o.ritual),
        desc: str(o.desc),
        classes: classes.map((c) => str(c.name)).filter(Boolean),
    }
}
