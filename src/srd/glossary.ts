import { asRulesets, flattenRules } from './rules'
import { mergeSupplement } from './mergeSupplement'
import type { SupplementEntry, RawEntry } from './mergeSupplement'
import { open5eSpellToSpell } from './open5eSpellToSpell'
import { open5eItemToItem } from './open5eItemToItem'
import type { Spell, MagicItem } from '../types'

export type GlossaryCategory = 'rule' | 'condition' | 'spell' | 'item'

export interface GlossaryEntry {
    category: GlossaryCategory
    key: string
    name: string
    desc: string
    meta?: Record<string, string>
}

const slug = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, '-')

interface RawObj { [k: string]: unknown }
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

function spellToEntry(s: Spell): GlossaryEntry {
    return {
        category: 'spell', key: s.key, name: s.name, desc: s.desc,
        meta: {
            Level: s.level === 0 ? 'Cantrip' : String(s.level),
            School: s.school,
            'Casting Time': s.castingTime,
            Range: s.range,
            Components: s.components,
            Duration: s.duration,
            ...(s.concentration ? { Concentration: 'Yes' } : {}),
            ...(s.ritual ? { Ritual: 'Yes' } : {}),
            ...(s.classes.length ? { Classes: s.classes.join(', ') } : {}),
        },
    }
}
function itemToEntry(i: MagicItem): GlossaryEntry {
    return {
        category: 'item', key: i.key, name: i.name, desc: i.desc,
        meta: {
            Type: i.type,
            Rarity: i.rarity,
            Attunement: i.requiresAttunement ? (i.attunementDetail ? `Yes (${i.attunementDetail})` : 'Yes') : 'No',
        },
    }
}

export function buildGlossary(sources: {
    rulesets?: unknown[]
    conditions?: unknown[]
    conditionsSupplement?: SupplementEntry[]
    rulesSupplement?: SupplementEntry[]
    spells?: unknown[]
    magicitems?: unknown[]
    homebrewSpells?: Spell[]
    homebrewItems?: MagicItem[]
}): Record<GlossaryCategory, GlossaryEntry[]> {
    const rawRules = flattenRules(asRulesets(sources.rulesets ?? [])) as unknown as RawEntry[]
    const rule: GlossaryEntry[] = mergeSupplement(rawRules, sources.rulesSupplement).map((r) => {
        const name = str(r.name)
        return { category: 'rule' as const, key: str(r.key) || slug(name), name, desc: str(r.desc) }
    })

    const rawConditions = (sources.conditions ?? []) as RawObj[]
    const merged = mergeSupplement(rawConditions, sources.conditionsSupplement)
    const condition: GlossaryEntry[] = merged.map((c) => {
        const name = str(c.name)
        return { category: 'condition' as const, key: str(c.key) || slug(name), name, desc: str(c.desc) }
    })

    const spell: GlossaryEntry[] = [
        ...(sources.spells ?? []).map(open5eSpellToSpell),
        ...(sources.homebrewSpells ?? []),
    ].map(spellToEntry)

    const item: GlossaryEntry[] = [
        ...(sources.magicitems ?? []).map(open5eItemToItem),
        ...(sources.homebrewItems ?? []),
    ].map(itemToEntry)

    return { rule, condition, spell, item }
}

export function searchGlossary(entries: GlossaryEntry[], query: string, limit = 30): GlossaryEntry[] {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const starts = entries
        .filter((e) => e.name.toLowerCase().startsWith(q))
        .sort((a, b) => a.name.length - b.name.length)
    const includes = entries.filter((e) => !starts.includes(e) && e.name.toLowerCase().includes(q))
    const inDesc = entries.filter((e) => !starts.includes(e) && !includes.includes(e) && e.desc.toLowerCase().includes(q))
    return [...starts, ...includes, ...inDesc].slice(0, limit)
}
