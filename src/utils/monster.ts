export function crLabel(cr: number): string {
    if (cr === 0.125) return '1/8'
    if (cr === 0.25) return '1/4'
    if (cr === 0.5) return '1/2'
    return String(cr)
}

export function abilityMod(score: number): number {
    return Math.floor((score - 10) / 2)
}

export function fmtMod(n: number): string {
    return n >= 0 ? `+${n}` : `${n}`
}
