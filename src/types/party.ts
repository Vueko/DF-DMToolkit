import type { ConditionInstance } from './condition'

export interface PartyMember {
    id: string
    name: string
    playerName?: string
    level?: number              // 1–20; alimenta el presupuesto XP de los encuentros
    race?: string
    characterClass?: string
    imageStoredId?: string      // retrato, guardado vía fs:save-player-image (id pc-<uuid>)
    ac?: number                 // referencia rápida
    passivePerception?: number
    maxHp?: number              // definirlo activa el trackeo de vida del PC
    hpCurrent?: number
    tempHp?: number             // vida temporal 5e
    deathSaves?: { successes: number; failures: number }   // solo relevante a 0 HP
    conditions: ConditionInstance[]
    notes?: string
}
