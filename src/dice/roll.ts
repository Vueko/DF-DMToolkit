// Núcleo de dados 5e: parseo y tirada puros, RNG inyectable (tests deterministas).
import { generateId } from '../utils/generateId'

export interface DiceTerm {
    count: number
    sides: number
    keep?: { mode: 'h' | 'l'; count: number }
    sign: 1 | -1
}
export type RollMode = 'normal' | 'advantage' | 'disadvantage'
export interface RollSpec {
    terms: (DiceTerm | number)[]   // number = modificador plano (ya con signo)
    mode: RollMode
}
export interface TermResult {
    rolls: number[]                // vacío para modificadores planos
    kept: boolean[]                // paralelo a rolls; false = dado descartado
    subtotal: number               // aporte (con signo) al total
}
export interface RollResult {
    id: string
    label?: string                 // "Wolf · Bite (to-hit)" — lo ponen las integraciones
    notation: string               // forma canónica del spec original
    mode: RollMode
    terms: TermResult[]
    total: number
    d20?: { natural: number; crit: 20 | 1 | null }
    timestamp: number
}

const MAX_TERMS = 10
const MAX_DICE = 40
const MAX_SIDES = 1000
const TERM_RE = /^(\d*)d(\d+)(?:k([hl])(\d+))?$/

export function parseNotation(input: string): RollSpec | null {
    const compact = input.trim().toLowerCase().replace(/\s+/g, '')
    if (!compact) return null
    const normalized = /^[+-]/.test(compact) ? compact : `+${compact}`
    const parts = normalized.match(/[+-][^+-]+/g)
    if (!parts || parts.join('') !== normalized || parts.length > MAX_TERMS) return null

    const terms: (DiceTerm | number)[] = []
    for (const part of parts) {
        const sign = (part[0] === '-' ? -1 : 1) as 1 | -1
        const body = part.slice(1)
        if (/^\d+$/.test(body)) {
            terms.push(sign * parseInt(body, 10))
            continue
        }
        const m = TERM_RE.exec(body)
        if (!m) return null
        const count = m[1] === '' ? 1 : parseInt(m[1], 10)
        const sides = parseInt(m[2], 10)
        if (count < 1 || count > MAX_DICE || sides < 2 || sides > MAX_SIDES) return null
        let keep: DiceTerm['keep']
        if (m[3]) {
            const keepCount = parseInt(m[4], 10)
            if (keepCount < 1 || keepCount > count) return null
            keep = { mode: m[3] as 'h' | 'l', count: keepCount }
        }
        terms.push({ count, sides, keep, sign })
    }
    return { terms, mode: 'normal' }
}

export function formatSpec(spec: RollSpec): string {
    return spec.terms
        .map((t, i) => {
            const negative = typeof t === 'number' ? t < 0 : t.sign < 0
            const body = typeof t === 'number'
                ? `${Math.abs(t)}`
                : `${t.count}d${t.sides}${t.keep ? `k${t.keep.mode}${t.keep.count}` : ''}`
            return i === 0 && !negative ? body : `${negative ? '-' : '+'}${body}`
        })
        .join('')
}

const rollDie = (sides: number, rng: () => number) => Math.floor(rng() * sides) + 1

export function roll(spec: RollSpec, rng: () => number = Math.random): RollResult {
    // adv/dis: si el primer término es 1d20 plano, se tira como 2d20 kh1/kl1
    const terms = spec.terms.map((t, i) => {
        if (i !== 0 || spec.mode === 'normal' || typeof t === 'number') return t
        if (t.count !== 1 || t.sides !== 20 || t.keep) return t
        return { ...t, count: 2, keep: { mode: spec.mode === 'advantage' ? 'h' as const : 'l' as const, count: 1 } }
    })

    const termResults: TermResult[] = terms.map((t) => {
        if (typeof t === 'number') return { rolls: [], kept: [], subtotal: t }
        const rolls = Array.from({ length: t.count }, () => rollDie(t.sides, rng))
        let kept = rolls.map(() => true)
        if (t.keep) {
            const keptIdx = rolls
                .map((v, i) => [v, i] as const)
                .sort((a, b) => (t.keep!.mode === 'h' ? b[0] - a[0] : a[0] - b[0]))
                .slice(0, t.keep.count)
                .map(([, i]) => i)
            kept = rolls.map((_, i) => keptIdx.includes(i))
        }
        const subtotal = t.sign * rolls.reduce((sum, v, i) => sum + (kept[i] ? v : 0), 0)
        return { rolls, kept, subtotal }
    })

    const total = termResults.reduce((s, t) => s + t.subtotal, 0)

    let d20: RollResult['d20']
    const first = terms[0]
    const firstRes = termResults[0]
    if (first !== undefined && typeof first !== 'number' && first.sides === 20 && first.sign === 1
        && firstRes.kept.filter(Boolean).length === 1) {
        const natural = firstRes.rolls[firstRes.kept.indexOf(true)]
        d20 = { natural, crit: natural === 20 ? 20 : natural === 1 ? 1 : null }
    }

    return {
        id: generateId(),
        notation: formatSpec(spec),
        mode: spec.mode,
        terms: termResults,
        total,
        d20,
        timestamp: Date.now(),
    }
}

// Duplica los dados de una notación de daño (crítico 5e); modificadores intactos.
export function critNotation(notation: string): string | null {
    const spec = parseNotation(notation)
    if (!spec) return null
    return formatSpec({
        ...spec,
        terms: spec.terms.map((t) =>
            typeof t === 'number' ? t : { ...t, count: Math.min(t.count * 2, MAX_DICE) }),
    })
}

// Construye un RollResult desde un d20 ya tirado (p. ej. iniciativa en combatStore).
export function d20RollResult(natural: number, bonus: number, label: string): RollResult {
    const terms: TermResult[] = [{ rolls: [natural], kept: [true], subtotal: natural }]
    if (bonus !== 0) terms.push({ rolls: [], kept: [], subtotal: bonus })
    return {
        id: generateId(),
        label,
        notation: bonus === 0 ? '1d20' : bonus > 0 ? `1d20+${bonus}` : `1d20${bonus}`,
        mode: 'normal',
        terms,
        total: natural + bonus,
        d20: { natural, crit: natural === 20 ? 20 : natural === 1 ? 1 : null },
        timestamp: Date.now(),
    }
}
