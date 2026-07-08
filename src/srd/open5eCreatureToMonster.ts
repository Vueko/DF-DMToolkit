import type { Monster, MonsterAbility } from '../types'
import { fmtMod } from '../utils/monster'

// Formas mínimas de la respuesta de /v2/creatures/ (campos que usamos; el resto se ignora).
interface RawNamed { name?: string }
interface RawUsage { type?: string; param?: number }
interface RawAction {
    name?: string
    desc?: string
    action_type?: string
    legendary_action_cost?: number | null
    usage_limits?: RawUsage | null
}
interface RawTrait { name?: string; desc?: string }
interface RawCreature {
    key?: string
    name?: string
    size?: RawNamed
    type?: RawNamed
    alignment?: string
    armor_class?: number
    armor_detail?: string
    hit_points?: number
    hit_dice?: string
    speed?: Record<string, unknown>
    ability_scores?: Record<string, number>
    modifiers?: Record<string, number>
    saving_throws?: Record<string, number>
    skill_bonuses?: Record<string, number>
    passive_perception?: number
    resistances_and_immunities?: Record<string, unknown>
    blindsight_range?: number | null
    darkvision_range?: number | null
    tremorsense_range?: number | null
    truesight_range?: number | null
    languages?: { as_string?: string }
    challenge_rating?: number
    experience_points?: number
    actions?: RawAction[]
    traits?: RawTrait[]
}

const ABILITIES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
const ABILITY_SHORT: Record<(typeof ABILITIES)[number], string> = {
    strength: 'Str', dexterity: 'Dex', constitution: 'Con',
    intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha',
}

const titleCase = (s: string): string =>
    s.split('_').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ')

function buildSpeed(speed: Record<string, unknown> | undefined): string {
    if (!speed) return ''
    const num = (k: string): number => (typeof speed[k] === 'number' ? (speed[k] as number) : 0)
    const parts: string[] = [`${num('walk')} ft.`]
    for (const mode of ['burrow', 'climb', 'fly', 'swim'] as const) {
        const v = num(mode)
        if (v > 0) parts.push(mode === 'fly' && speed.hover === true ? `fly ${v} ft. (hover)` : `${mode} ${v} ft.`)
    }
    return parts.join(', ')
}

// Saves proficientes = los que difieren del modificador base.
function buildSaves(raw: RawCreature): string | undefined {
    const saves = raw.saving_throws ?? {}
    const mods = raw.modifiers ?? {}
    const parts = ABILITIES
        .filter((a) => typeof saves[a] === 'number' && saves[a] !== mods[a])
        .map((a) => `${ABILITY_SHORT[a]} ${fmtMod(saves[a])}`)
    return parts.length > 0 ? parts.join(', ') : undefined
}

function buildSkills(raw: RawCreature): string | undefined {
    const entries = Object.entries(raw.skill_bonuses ?? {})
    if (entries.length === 0) return undefined
    return entries.map(([k, v]) => `${titleCase(k)} ${fmtMod(v)}`).join(', ')
}

function buildSenses(raw: RawCreature): string | undefined {
    const parts: string[] = []
    const senses: [string, number | null | undefined][] = [
        ['Blindsight', raw.blindsight_range],
        ['Darkvision', raw.darkvision_range],
        ['Tremorsense', raw.tremorsense_range],
        ['Truesight', raw.truesight_range],
    ]
    for (const [label, range] of senses) {
        if (typeof range === 'number' && range > 0) parts.push(`${label} ${range} ft.`)
    }
    if (typeof raw.passive_perception === 'number') parts.push(`Passive Perception ${raw.passive_perception}`)
    return parts.length > 0 ? parts.join(', ') : undefined
}

function display(raw: RawCreature, field: string): string | undefined {
    const value = raw.resistances_and_immunities?.[field]
    return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

function usageLabel(action: RawAction): string | undefined {
    const u = action.usage_limits
    if (u && typeof u.param === 'number') {
        if (u.type === 'PER_DAY') return `${u.param}/Day`
        if (u.type === 'RECHARGE_ON_ROLL') return `Recharge ${u.param}–6`
    }
    const cost = action.legendary_action_cost
    if (typeof cost === 'number' && cost > 1) return `Costs ${cost} Actions`
    return undefined
}

function toAbility(key: string, section: string, index: number, name: string, desc: string, usage?: string): MonsterAbility {
    return { id: `${key}:${section}:${index}`, name, description: desc, ...(usage ? { usage } : {}) }
}

export function open5eCreatureToMonster(rawInput: unknown): Monster {
    const raw = (rawInput ?? {}) as RawCreature
    const key = raw.key ?? 'unknown'
    const scores = raw.ability_scores ?? {}

    const sections: Record<string, MonsterAbility[]> = {
        ACTION: [], BONUS_ACTION: [], REACTION: [], LEGENDARY_ACTION: [], LAIR_ACTION: [],
    }
    for (const action of raw.actions ?? []) {
        const type = action.action_type ?? 'ACTION'
        const bucket = sections[type] ?? sections.ACTION
        bucket.push(toAbility(key, type.toLowerCase(), bucket.length, action.name ?? '', action.desc ?? '', usageLabel(action)))
    }

    const passives = (raw.traits ?? []).map((t, i) => toAbility(key, 'trait', i, t.name ?? '', t.desc ?? ''))
    let legendaryResistance: number | undefined
    for (const t of raw.traits ?? []) {
        const match = /^Legendary Resistance \((\d+)\/Day/.exec(t.name ?? '')
        if (match) legendaryResistance = Number(match[1])
    }

    const saves = buildSaves(raw)
    const skills = buildSkills(raw)
    const senses = buildSenses(raw)
    const vulnerabilities = display(raw, 'damage_vulnerabilities_display')
    const resistances = display(raw, 'damage_resistances_display')
    const immunities = display(raw, 'damage_immunities_display')
    const conditionImmunities = display(raw, 'condition_immunities_display')

    return {
        id: `srd:${key}`,
        source: 'srd',
        name: raw.name ?? key,
        size: raw.size?.name ?? '',
        type: raw.type?.name ?? '',
        alignment: raw.alignment ?? '',
        ac: raw.armor_class ?? 10,
        ...(raw.armor_detail ? { acNote: raw.armor_detail } : {}),
        hp: { average: raw.hit_points ?? 0, ...(raw.hit_dice ? { formula: raw.hit_dice } : {}) },
        speed: buildSpeed(raw.speed),
        stats: {
            str: scores.strength ?? 10, dex: scores.dexterity ?? 10, con: scores.constitution ?? 10,
            int: scores.intelligence ?? 10, wis: scores.wisdom ?? 10, cha: scores.charisma ?? 10,
        },
        ...(saves ? { saves } : {}),
        ...(skills ? { skills } : {}),
        ...(vulnerabilities ? { vulnerabilities } : {}),
        ...(resistances ? { resistances } : {}),
        ...(immunities ? { immunities } : {}),
        ...(conditionImmunities ? { conditionImmunities } : {}),
        ...(senses ? { senses } : {}),
        ...(raw.languages?.as_string ? { languages: raw.languages.as_string } : {}),
        cr: raw.challenge_rating ?? 0,
        xp: raw.experience_points ?? 0,
        passives,
        actions: sections.ACTION,
        bonusActions: sections.BONUS_ACTION,
        reactions: sections.REACTION,
        legendaryActions: sections.LEGENDARY_ACTION,
        ...(legendaryResistance !== undefined ? { legendaryResistance } : {}),
        ...(sections.LAIR_ACTION.length > 0 ? { lairActions: sections.LAIR_ACTION } : {}),
    }
}
