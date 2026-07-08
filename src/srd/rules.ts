export interface SrdRule { key: string; name: string; desc: string; ruleset?: string; index?: number }
export interface SrdRuleset { key: string; name: string; desc?: string; rules: SrdRule[] }

interface RawRule { key?: unknown; name?: unknown; desc?: unknown; ruleset?: unknown; index?: unknown }
interface RawRuleset { key?: unknown; name?: unknown; desc?: unknown; rules?: unknown }

const toRule = (r: RawRule): SrdRule => ({
    key: typeof r.key === 'string' ? r.key : '',
    name: typeof r.name === 'string' ? r.name : '',
    desc: typeof r.desc === 'string' ? r.desc : '',
    ...(typeof r.ruleset === 'string' ? { ruleset: r.ruleset } : {}),
    ...(typeof r.index === 'number' ? { index: r.index } : {}),
})

export function asRulesets(data: unknown[] | null): SrdRuleset[] {
    return (data ?? [])
        .filter((r): r is RawRuleset => !!r && typeof r === 'object')
        .map((r) => ({
            key: typeof r.key === 'string' ? r.key : '',
            name: typeof r.name === 'string' ? r.name : '',
            ...(typeof r.desc === 'string' ? { desc: r.desc } : {}),
            rules: Array.isArray(r.rules) ? (r.rules as RawRule[]).map(toRule) : [],
        }))
}

export function flattenRules(rulesets: SrdRuleset[]): SrdRule[] {
    return rulesets.flatMap((rs) => [...rs.rules].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)))
}

export function searchRules(rulesets: SrdRuleset[], query: string, limit = 12): SrdRule[] {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const all = flattenRules(rulesets)
    const starts = all.filter((r) => r.name.toLowerCase().startsWith(q))
    const includes = all.filter((r) => !starts.includes(r) && r.name.toLowerCase().includes(q))
    const inDesc = all.filter((r) => !starts.includes(r) && !includes.includes(r) && r.desc.toLowerCase().includes(q))
    return [...starts, ...includes, ...inDesc].slice(0, limit)
}
