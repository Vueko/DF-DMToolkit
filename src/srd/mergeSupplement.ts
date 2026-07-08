export interface SupplementEntry { name: string; desc: string }

export interface Supplement {
    conditions?: SupplementEntry[]
    rules?: SupplementEntry[]
    spells?: SupplementEntry[]
    magicitems?: SupplementEntry[]
}

export interface RawEntry { name?: unknown; desc?: unknown; [k: string]: unknown }

const norm = (v: unknown): string => (typeof v === 'string' ? v.trim().toLowerCase() : '')
const isEmpty = (v: unknown): boolean => !(typeof v === 'string' && v.trim().length > 0)

// Fusiona un suplemento sobre los resultados de la API:
// - si la entrada de la API tiene desc vacío y el suplemento la cubre (por nombre), rellena desc;
// - las entradas del suplemento que la API no trae se añaden al final;
// - nunca pisa un desc no vacío de la API; conserva el resto de campos de la entrada de la API.
export function mergeSupplement(entries: RawEntry[], supplement: SupplementEntry[] | undefined): RawEntry[] {
    if (!supplement || supplement.length === 0) return entries
    const byName = new Map(supplement.map((s) => [norm(s.name), s]))
    const seen = new Set<string>()

    const merged: RawEntry[] = entries.map((e) => {
        const sup = byName.get(norm(e.name))
        if (sup) seen.add(norm(e.name))
        if (sup && isEmpty(e.desc)) return { ...e, desc: sup.desc }
        return e
    })

    for (const s of supplement) {
        if (!seen.has(norm(s.name))) merged.push({ name: s.name, desc: s.desc })
    }
    return merged
}
