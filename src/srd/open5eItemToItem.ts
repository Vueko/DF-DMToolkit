import type { MagicItem } from '../types'

interface RawObj { [k: string]: unknown }
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function open5eItemToItem(raw: unknown): MagicItem {
    const o = (raw ?? {}) as RawObj
    const category = o.category as RawObj | undefined
    const rarity = o.rarity as RawObj | undefined
    const detail = o.attunement_detail
    return {
        key: str(o.key),
        name: str(o.name),
        type: str(category?.name),
        rarity: str(rarity?.name),
        requiresAttunement: o.requires_attunement === true,
        attunementDetail: typeof detail === 'string' && detail.length > 0 ? detail : null,
        desc: str(o.desc),
    }
}
