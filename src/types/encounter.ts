export interface EncounterEntry {
    monsterId: string
    count: number
}

// Composición del grupo (nivel × cantidad) usada por el presupuesto XP.
// Se deriva del roster real de la campaña vía partyToGroups (encounterXp.ts).
export interface EncounterPartyGroup {
    level: number
    count: number
}

export interface Encounter {
    id: string
    name: string
    entries: EncounterEntry[]
    notes?: string
}
