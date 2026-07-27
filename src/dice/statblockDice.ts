// Segmenta texto de statblock en spans clicables de tirada. Puro, sin React.

export type RollKind = 'attack' | 'damage'
export type Segment =
    | { kind: 'text'; text: string }
    | { kind: 'roll'; text: string; notation: string; rollKind: RollKind }

// "Attack Roll: +4" (2024) | "+4 to hit" (legacy) | "(1d6 + 2)" (daño)
const DICE_SEGMENT_RE = /(Attack Roll:\s*\+\d+)|(\+\d+ to hit)|(\(\d*d\d+(?:\s*[+-]\s*\d+)?\))/g

export function segmentDiceText(text: string): Segment[] {
    const segments: Segment[] = []
    let last = 0
    for (const m of text.matchAll(DICE_SEGMENT_RE)) {
        const idx = m.index
        if (idx > last) segments.push({ kind: 'text', text: text.slice(last, idx) })
        const matched = m[0]
        if (m[3]) {
            segments.push({
                kind: 'roll', text: matched,
                notation: matched.slice(1, -1).replace(/\s+/g, ''), rollKind: 'damage',
            })
        } else {
            const bonus = /\+\d+/.exec(matched)![0]
            segments.push({ kind: 'roll', text: matched, notation: `1d20${bonus}`, rollKind: 'attack' })
        }
        last = idx + matched.length
    }
    if (last < text.length) segments.push({ kind: 'text', text: text.slice(last) })
    return segments
}

export type BonusSegment =
    | { kind: 'text'; text: string }
    | { kind: 'bonus'; text: string; name: string; bonus: number }

// "Nombre +N" (nombre = letras/espacios): un save o skill clicable dentro de una línea.
const BONUS_PAIR_RE = /([A-Za-z][A-Za-z ]*?)\s*([+-]\d+)/g

// Segmenta una línea de saves/skills preservando el texto intermedio (comas, notas
// como "(while raging)", etc.), con cada par nombre/bono como span clicable.
export function segmentBonusText(line: string): BonusSegment[] {
    const segments: BonusSegment[] = []
    let last = 0
    for (const m of line.matchAll(BONUS_PAIR_RE)) {
        const idx = m.index
        if (idx > last) segments.push({ kind: 'text', text: line.slice(last, idx) })
        segments.push({ kind: 'bonus', text: m[0], name: m[1].trim(), bonus: parseInt(m[2], 10) })
        last = idx + m[0].length
    }
    if (last < line.length) segments.push({ kind: 'text', text: line.slice(last) })
    return segments
}

// "Dex +5, Con +3" | "Perception +6, Stealth +4" → pares nombre/bono (sin el texto intermedio).
export function parseBonusPairs(line: string): { name: string; bonus: number }[] {
    return segmentBonusText(line)
        .filter((s): s is Extract<BonusSegment, { kind: 'bonus' }> => s.kind === 'bonus')
        .map(({ name, bonus }) => ({ name, bonus }))
}
