import type { Monster, MonsterAbility } from '../types'
import { flattenEntries } from './entries5e'
import { crToNumber, crToXp } from './crXp'

// --- Mapas de códigos 5etools ---
const SIZE: Record<string, string> = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' }
const SIZE_INV: Record<string, string> = { Tiny: 'T', Small: 'S', Medium: 'M', Large: 'L', Huge: 'H', Gargantuan: 'G' }
const ALIGN: Record<string, string> = {
    L: 'Lawful', N: 'Neutral', C: 'Chaotic', G: 'Good', E: 'Evil', U: 'Unaligned', A: 'Any Alignment',
}
const ABILITIES: [keyof Monster['stats'], string][] = [
    ['str', 'Str'], ['dex', 'Dex'], ['con', 'Con'], ['int', 'Int'], ['wis', 'Wis'], ['cha', 'Cha'],
]

const titleCase = (s: string): string => s.replace(/(^|[\s_])(\w)/g, (_m, p, c) => p + c.toUpperCase())

interface RawAbility { name?: string; entries?: unknown[] }
interface RawCreature {
    name?: string; size?: unknown; type?: unknown; alignment?: unknown
    ac?: unknown; hp?: { average?: number; formula?: string }; speed?: Record<string, unknown>
    str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number
    save?: Record<string, string>; skill?: Record<string, string>; passive?: number
    senses?: unknown[]; languages?: unknown[]
    resist?: unknown[]; immune?: unknown[]; vulnerable?: unknown[]; conditionImmune?: unknown[]
    cr?: unknown
    trait?: RawAbility[]; action?: RawAbility[]; bonus?: RawAbility[]; reaction?: RawAbility[]; legendary?: RawAbility[]
}

function firstStr(v: unknown): string {
    if (Array.isArray(v)) return typeof v[0] === 'string' ? v[0] : ''
    return typeof v === 'string' ? v : ''
}

function mapSize(v: unknown): string {
    const code = firstStr(v)
    return SIZE[code] ?? code
}

function mapType(v: unknown): string {
    if (typeof v === 'string') return titleCase(v)
    if (v && typeof v === 'object') {
        const o = v as { type?: string; tags?: string[] }
        const base = titleCase(o.type ?? '')
        return o.tags?.length ? `${base} (${o.tags.join(', ')})` : base
    }
    return ''
}

function mapAlignment(v: unknown): string {
    if (!Array.isArray(v)) return ''
    return v.map((c) => (typeof c === 'string' ? ALIGN[c] ?? c : '')).filter(Boolean).join(' ')
}

function mapAc(v: unknown): { ac: number; acNote?: string } {
    if (!Array.isArray(v) || v.length === 0) return { ac: 10 }
    const first = v[0]
    if (typeof first === 'number') return { ac: first }
    if (first && typeof first === 'object') {
        const o = first as { ac?: number; from?: string[] }
        return { ac: o.ac ?? 10, ...(o.from?.length ? { acNote: o.from.join(', ') } : {}) }
    }
    return { ac: 10 }
}

function mapSpeed(v: Record<string, unknown> | undefined): string {
    if (!v) return ''
    const num = (k: string): number => (typeof v[k] === 'number' ? (v[k] as number) : 0)
    const parts: string[] = []
    if (num('walk') > 0) parts.push(`${num('walk')} ft.`)
    for (const mode of ['burrow', 'climb', 'fly', 'swim'] as const) {
        if (num(mode) > 0) parts.push(mode === 'fly' && v.canHover ? `fly ${num(mode)} ft. (hover)` : `${mode} ${num(mode)} ft.`)
    }
    return parts.join(', ')
}

function mapSaves(save: Record<string, string> | undefined): string | undefined {
    if (!save) return undefined
    const parts = ABILITIES
        .filter(([k]) => save[k] !== undefined)
        .map(([k, label]) => `${label} ${save[k]}`)
    return parts.length ? parts.join(', ') : undefined
}

function mapSkills(skill: Record<string, string> | undefined): string | undefined {
    if (!skill) return undefined
    const entries = Object.entries(skill)
    return entries.length ? entries.map(([k, v]) => `${titleCase(k)} ${v}`).join(', ') : undefined
}

function mapList(v: unknown[] | undefined): string | undefined {
    if (!v || v.length === 0) return undefined
    const parts = v.map((x) => (typeof x === 'string' ? x : x && typeof x === 'object' && 'special' in x ? String((x as { special: unknown }).special) : '')).filter(Boolean)
    return parts.length ? parts.join(', ') : undefined
}

function mapSenses(senses: unknown[] | undefined, passive: number | undefined): string | undefined {
    const parts: string[] = []
    if (senses) parts.push(...senses.filter((s): s is string => typeof s === 'string'))
    if (typeof passive === 'number') parts.push(`passive Perception ${passive}`)
    return parts.length ? parts.join(', ') : undefined
}

function toAbilities(list: RawAbility[] | undefined, key: string, prefix: string): MonsterAbility[] {
    return (list ?? []).map((a) => {
        const name = a.name ?? ''
        const usageMatch = /\(([^)]*(?:Recharge|\/Day|\/Turn)[^)]*)\)/.exec(name)
        return {
            id: `${prefix}:${key}:${crypto.randomUUID()}`,
            name,
            description: flattenEntries(a.entries ?? []),
            ...(usageMatch ? { usage: usageMatch[1] } : {}),
        }
    })
}

export function convert5eMonster(rawInput: unknown): Monster {
    const raw = (rawInput ?? {}) as RawCreature
    const id = `hb:${crypto.randomUUID()}`
    const { ac, acNote } = mapAc(raw.ac)
    const cr = crToNumber(raw.cr)

    const passives = toAbilities(raw.trait, 'trait', id)
    let legendaryResistance: number | undefined
    for (const t of raw.trait ?? []) {
        const match = /^Legendary Resistance \((\d+)\/Day/.exec(t.name ?? '')
        if (match) legendaryResistance = Number(match[1])
    }

    const saves = mapSaves(raw.save)
    const skills = mapSkills(raw.skill)
    const senses = mapSenses(raw.senses, raw.passive)
    const languages = mapList(raw.languages)
    const vulnerabilities = mapList(raw.vulnerable)
    const resistances = mapList(raw.resist)
    const immunities = mapList(raw.immune)
    const conditionImmunities = mapList(raw.conditionImmune)

    return {
        id,
        source: 'homebrew',
        name: raw.name ?? 'Homebrew Monster',
        size: mapSize(raw.size),
        type: mapType(raw.type),
        alignment: mapAlignment(raw.alignment),
        ac,
        ...(acNote ? { acNote } : {}),
        hp: { average: raw.hp?.average ?? 0, ...(raw.hp?.formula ? { formula: raw.hp.formula } : {}) },
        speed: mapSpeed(raw.speed),
        stats: {
            str: raw.str ?? 10, dex: raw.dex ?? 10, con: raw.con ?? 10,
            int: raw.int ?? 10, wis: raw.wis ?? 10, cha: raw.cha ?? 10,
        },
        ...(saves ? { saves } : {}),
        ...(skills ? { skills } : {}),
        ...(vulnerabilities ? { vulnerabilities } : {}),
        ...(resistances ? { resistances } : {}),
        ...(immunities ? { immunities } : {}),
        ...(conditionImmunities ? { conditionImmunities } : {}),
        ...(senses ? { senses } : {}),
        ...(languages ? { languages } : {}),
        cr,
        xp: crToXp(cr),
        passives,
        actions: toAbilities(raw.action, 'action', id),
        bonusActions: toAbilities(raw.bonus, 'bonus', id),
        reactions: toAbilities(raw.reaction, 'reaction', id),
        legendaryActions: toAbilities(raw.legendary, 'legendary', id),
        ...(legendaryResistance !== undefined ? { legendaryResistance } : {}),
    }
}

// --- Inverso best-effort para el export 5etools ---
function crToStr(cr: number): string {
    if (cr === 0.125) return '1/8'
    if (cr === 0.25) return '1/4'
    if (cr === 0.5) return '1/2'
    return String(cr)
}

function abilitiesTo5e(list: MonsterAbility[]): { name: string; entries: string[] }[] {
    return list.map((a) => ({ name: a.name, entries: [a.description] }))
}

export function monsterTo5e(m: Monster): object {
    return {
        name: m.name,
        source: 'HOMEBREW',
        size: [SIZE_INV[m.size] ?? 'M'],
        type: m.type.toLowerCase(),
        alignment: ['U'],
        ac: [{ ac: m.ac, ...(m.acNote ? { from: [m.acNote] } : {}) }],
        hp: { average: m.hp.average, ...(m.hp.formula ? { formula: m.hp.formula } : {}) },
        str: m.stats.str, dex: m.stats.dex, con: m.stats.con, int: m.stats.int, wis: m.stats.wis, cha: m.stats.cha,
        cr: crToStr(m.cr),
        trait: abilitiesTo5e(m.passives),
        action: abilitiesTo5e(m.actions),
        bonus: abilitiesTo5e(m.bonusActions),
        reaction: abilitiesTo5e(m.reactions),
        legendary: abilitiesTo5e(m.legendaryActions),
    }
}
