// Tabla CR→XP del DMG (0..30).
export const CR_XP: Record<string, number> = {
    '0': 10, '0.125': 25, '0.25': 50, '0.5': 100,
    '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900,
    '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000,
    '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000,
    '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
    '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
}

export function crToNumber(cr: unknown): number {
    if (typeof cr === 'number') return cr
    if (typeof cr === 'object' && cr && 'cr' in cr) return crToNumber((cr as { cr: unknown }).cr)
    if (typeof cr !== 'string') return 0
    if (cr === '1/8') return 0.125
    if (cr === '1/4') return 0.25
    if (cr === '1/2') return 0.5
    const n = Number(cr)
    if (!Number.isNaN(n)) return n
    const m = /\d+(\.\d+)?/.exec(cr)   // formatos raros tipo "M5"
    return m ? Number(m[0]) : 0
}

export function crToXp(cr: number): number {
    return CR_XP[String(cr)] ?? 0
}

// Bono de competencia por CR (DMG): +2 hasta CR 4, +1 cada 4 CR después.
export function crToProficiency(cr: number): number {
    return Math.max(2, Math.floor((Math.max(cr, 1) - 1) / 4) + 2)
}
