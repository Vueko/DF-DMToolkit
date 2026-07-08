import type { MagicItem } from '../types'
import { flattenEntries } from './entries5e'
import { strip5eTags } from './tags5e'

const TYPE: Record<string, string> = {
    M: 'Melee Weapon', R: 'Ranged Weapon', A: 'Ammunition', LA: 'Light Armor', MA: 'Medium Armor',
    HA: 'Heavy Armor', S: 'Shield', WD: 'Wand', RD: 'Rod', RG: 'Ring', P: 'Potion', SC: 'Scroll',
    W: 'Wondrous Item', GV: 'Generic Variant', AT: 'Artisan Tools', INS: 'Instrument', G: 'Adventuring Gear', $: 'Treasure',
}
const TYPE_INV: Record<string, string> = Object.fromEntries(Object.entries(TYPE).map(([k, v]) => [v, k]))

interface RawObj { [k: string]: unknown }
const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : '')

function mapType(raw: RawObj): string {
    const code = typeof raw.type === 'string' ? raw.type.split('|')[0] : ''
    if (code && TYPE[code]) return TYPE[code]
    if (raw.wondrous === true) return 'Wondrous Item'
    return code
}

function mapAttune(reqAttune: unknown): { requiresAttunement: boolean; attunementDetail: string | null } {
    if (reqAttune === true) return { requiresAttunement: true, attunementDetail: null }
    if (typeof reqAttune === 'string' && reqAttune.length > 0) return { requiresAttunement: true, attunementDetail: reqAttune }
    return { requiresAttunement: false, attunementDetail: null }
}

export function convert5eItem(rawInput: unknown): MagicItem {
    const raw = (rawInput ?? {}) as RawObj
    const rarity = typeof raw.rarity === 'string' && raw.rarity !== 'none' ? cap(raw.rarity) : ''
    const { requiresAttunement, attunementDetail } = mapAttune(raw.reqAttune)
    return {
        key: '',
        name: typeof raw.name === 'string' ? raw.name : '',
        type: mapType(raw),
        rarity,
        requiresAttunement,
        attunementDetail,
        desc: strip5eTags(flattenEntries(Array.isArray(raw.entries) ? raw.entries : [])),
        source: 'homebrew',
    }
}

// --- Inverso best-effort ---
export function itemTo5e(i: MagicItem): object {
    const code = TYPE_INV[i.type]
    return {
        name: i.name,
        source: 'HOMEBREW',
        rarity: i.rarity ? i.rarity.toLowerCase() : 'none',
        ...(i.type === 'Wondrous Item' ? { wondrous: true } : code ? { type: code } : {}),
        ...(i.requiresAttunement ? { reqAttune: i.attunementDetail ?? true } : {}),
        entries: [i.desc],
    }
}
