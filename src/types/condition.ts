export const CONDITION_IDS = [
    'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
    'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
    'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
] as const

export type ConditionId = (typeof CONDITION_IDS)[number]

export interface ConditionInstance {
    conditionId: ConditionId
    level?: 1 | 2 | 3 | 4 | 5 | 6   // solo exhaustion
    source?: string                  // "Hold Person del cultista"
    roundsLeft?: number              // al llegar a 0 se marca para revisión (no se auto-elimina)
}

// Nombre para mostrar (contenido SRD → inglés). Fallback local sin red.
export function conditionLabel(id: ConditionId): string {
    return id.charAt(0).toUpperCase() + id.slice(1)
}
