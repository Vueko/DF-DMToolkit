import type { EncounterEntry, EncounterPartyGroup } from '../types'

export type EncounterDifficulty = 'low' | 'moderate' | 'high'
export const DIFFICULTIES = ['low', 'moderate', 'high'] as const

// DMG 2024, "XP Budget per Character" (capítulo 4, Combat Encounters).
export const XP_BUDGET_PER_CHARACTER: Record<number, Record<EncounterDifficulty, number>> = {
    1: { low: 50, moderate: 75, high: 100 },
    2: { low: 100, moderate: 150, high: 200 },
    3: { low: 150, moderate: 225, high: 400 },
    4: { low: 250, moderate: 375, high: 500 },
    5: { low: 500, moderate: 750, high: 1100 },
    6: { low: 600, moderate: 1000, high: 1400 },
    7: { low: 750, moderate: 1300, high: 1700 },
    8: { low: 1000, moderate: 1700, high: 2100 },
    9: { low: 1300, moderate: 2000, high: 2600 },
    10: { low: 1600, moderate: 2300, high: 3100 },
    11: { low: 1900, moderate: 2900, high: 4100 },
    12: { low: 2200, moderate: 3700, high: 4700 },
    13: { low: 2600, moderate: 4200, high: 5400 },
    14: { low: 2900, moderate: 5000, high: 6200 },
    15: { low: 3300, moderate: 5400, high: 7800 },
    16: { low: 3800, moderate: 6100, high: 9800 },
    17: { low: 4500, moderate: 8000, high: 11700 },
    18: { low: 5000, moderate: 9000, high: 14200 },
    19: { low: 5500, moderate: 10500, high: 17200 },
    20: { low: 6400, moderate: 11500, high: 22000 },
}

const clampLevel = (level: number): number => Math.min(20, Math.max(1, Math.round(level)))

export function xpBudget(party: EncounterPartyGroup[], difficulty: EncounterDifficulty): number {
    return party.reduce((sum, g) => sum + XP_BUDGET_PER_CHARACTER[clampLevel(g.level)][difficulty] * g.count, 0)
}

// Suma directa de XP (en 2024 no hay multiplicador por número de monstruos).
export function encounterXpTotal(entries: EncounterEntry[], xpById: ReadonlyMap<string, number>): number {
    return entries.reduce((sum, e) => sum + (xpById.get(e.monsterId) ?? 0) * e.count, 0)
}

// Deriva los grupos nivel×cantidad del party real de la campaña (nivel ausente → 1).
export function partyToGroups(members: { level?: number }[]): EncounterPartyGroup[] {
    const byLevel = new Map<number, number>()
    for (const m of members) {
        const level = Math.min(20, Math.max(1, Math.round(m.level ?? 1)))
        byLevel.set(level, (byLevel.get(level) ?? 0) + 1)
    }
    return [...byLevel.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([level, count]) => ({ level, count }))
}

export function resultingDifficulty(totalXp: number, party: EncounterPartyGroup[]): 'trivial' | EncounterDifficulty {
    if (party.length === 0) return 'trivial'
    if (totalXp >= xpBudget(party, 'high')) return 'high'
    if (totalXp >= xpBudget(party, 'moderate')) return 'moderate'
    if (totalXp >= xpBudget(party, 'low')) return 'low'
    return 'trivial'
}
