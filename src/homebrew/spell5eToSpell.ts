import type { Spell } from '../types'
import { flattenEntries } from './entries5e'
import { strip5eTags } from './tags5e'

const SCHOOL: Record<string, string> = {
    A: 'Abjuration', C: 'Conjuration', D: 'Divination', En: 'Enchantment',
    Ev: 'Evocation', I: 'Illusion', N: 'Necromancy', T: 'Transmutation', P: 'Psionic',
}
const SCHOOL_INV: Record<string, string> = Object.fromEntries(Object.entries(SCHOOL).map(([k, v]) => [v, k]))

interface RawObj { [k: string]: unknown }
const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : '')
const plural = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? '' : 's'}`

function mapTime(time: unknown): string {
    const first = Array.isArray(time) ? (time[0] as RawObj) : undefined
    if (!first) return ''
    const n = typeof first.number === 'number' ? first.number : 1
    const unit = typeof first.unit === 'string' ? first.unit : 'action'
    const label = unit === 'bonus' ? 'bonus action' : unit
    return unit === 'action' || unit === 'bonus' || unit === 'reaction' ? `${n} ${label}` : plural(n, label)
}

function mapRange(range: unknown): string {
    const r = range as RawObj | undefined
    if (!r) return ''
    const t = typeof r.type === 'string' ? r.type : ''
    const d = r.distance as RawObj | undefined
    const amount = d && typeof d.amount === 'number' ? d.amount : undefined
    const dtype = d && typeof d.type === 'string' ? d.type : ''
    if (['self', 'touch', 'sight', 'unlimited', 'special'].includes(t)) {
        return amount !== undefined && (dtype === 'feet' || dtype === 'miles') ? `${cap(t)} (${amount} ${dtype})` : cap(t)
    }
    if (d) {
        if (dtype === 'feet' || dtype === 'miles') return `${amount} ${amount === 1 ? dtype.replace(/s$/, '') : dtype}`
        if (dtype === 'self') return 'Self'
        if (dtype === 'touch') return 'Touch'
        return cap(dtype)
    }
    return cap(t)
}

function mapComponents(c: unknown): string {
    const o = c as RawObj | undefined
    if (!o) return ''
    const parts: string[] = []
    if (o.v === true) parts.push('V')
    if (o.s === true) parts.push('S')
    if (o.m !== undefined && o.m !== false) {
        if (o.m === true) parts.push('M')
        else {
            const text = typeof o.m === 'string' ? o.m : typeof (o.m as RawObj).text === 'string' ? (o.m as RawObj).text as string : ''
            parts.push(text ? `M (${text})` : 'M')
        }
    }
    return parts.join(', ')
}

function mapDuration(duration: unknown): { text: string; concentration: boolean } {
    const d = Array.isArray(duration) ? (duration[0] as RawObj) : undefined
    if (!d) return { text: '', concentration: false }
    const concentration = d.concentration === true
    const type = typeof d.type === 'string' ? d.type : ''
    if (type === 'instant') return { text: 'Instantaneous', concentration }
    if (type === 'permanent') return { text: 'Until dispelled', concentration }
    if (type === 'special') return { text: 'Special', concentration }
    const inner = d.duration as RawObj | undefined
    if (inner && typeof inner.amount === 'number' && typeof inner.type === 'string') {
        return { text: plural(inner.amount, inner.type), concentration }
    }
    return { text: cap(type), concentration }
}

function mapDesc(raw: RawObj): string {
    const parts: string[] = []
    if (Array.isArray(raw.entries)) parts.push(flattenEntries(raw.entries))
    if (Array.isArray(raw.entriesHigherLevel)) {
        const hl = (raw.entriesHigherLevel as RawObj[]).flatMap((h) => (Array.isArray(h.entries) ? h.entries : []))
        if (hl.length) parts.push('**At Higher Levels.** ' + flattenEntries(hl))
    }
    return strip5eTags(parts.filter(Boolean).join('\n\n'))
}

export function convert5eSpell(rawInput: unknown): Spell {
    const raw = (rawInput ?? {}) as RawObj
    const school = typeof raw.school === 'string' ? raw.school : ''
    const rawClasses = raw.classes as RawObj | undefined
    const classList = Array.isArray(rawClasses?.fromClassList) ? (rawClasses!.fromClassList as RawObj[]) : []
    const { text: duration, concentration } = mapDuration(raw.duration)
    return {
        key: '',
        name: typeof raw.name === 'string' ? raw.name : '',
        level: typeof raw.level === 'number' ? raw.level : 0,
        school: SCHOOL[school] ?? school,
        castingTime: mapTime(raw.time),
        range: mapRange(raw.range),
        components: mapComponents(raw.components),
        duration,
        concentration,
        ritual: (raw.meta as RawObj)?.ritual === true,
        desc: mapDesc(raw),
        classes: classList.map((c) => (typeof c.name === 'string' ? c.name : '')).filter(Boolean),
        source: 'homebrew',
    }
}

// --- Inverso best-effort ---
function timeTo5e(castingTime: string): object {
    const m = /^(\d+)\s+(.*)$/.exec(castingTime)
    const n = m ? Number(m[1]) : 1
    const rest = m ? m[2] : 'action'
    const unit = rest.startsWith('bonus') ? 'bonus' : rest.replace(/s$/, '')
    return { number: n, unit }
}

export function spellTo5e(s: Spell): object {
    const m = /^(\d+)\s+(feet|miles)$/.exec(s.range)
    return {
        name: s.name,
        source: 'HOMEBREW',
        level: s.level,
        school: SCHOOL_INV[s.school] ?? s.school,
        time: [timeTo5e(s.castingTime)],
        range: m ? { type: 'point', distance: { type: m[2], amount: Number(m[1]) } } : { type: 'special' },
        components: {
            ...(s.components.includes('V') ? { v: true } : {}),
            ...(s.components.includes('S') ? { s: true } : {}),
            ...(s.components.includes('M') ? { m: true } : {}),
        },
        duration: [s.duration === 'Instantaneous' ? { type: 'instant' } : { type: 'timed', ...(s.concentration ? { concentration: true } : {}) }],
        ...(s.ritual ? { meta: { ritual: true } } : {}),
        entries: [s.desc],
        classes: { fromClassList: s.classes.map((name) => ({ name, source: 'HOMEBREW' })) },
    }
}
