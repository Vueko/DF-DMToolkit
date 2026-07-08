import type { ConditionInstance } from './condition'

export interface EnemyInstance {
    instanceId: string
    monsterId: string
    label: string               // "Goblin 2"
    hpCurrent: number
    hpMax: number               // editable (media o tirada)
    tempHp?: number             // vida temporal 5e: el daño la consume primero
    conditions: ConditionInstance[]
    legendaryActionsLeft?: number
    legendaryActionsMax?: number      // para el reset al avanzar ronda
    legendaryResistanceLeft?: number
    legendaryResistanceMax?: number
    concentrating?: boolean
    notes?: string
}

export interface Combatant {
    id: string
    kind: 'pc' | 'enemy'
    refId: string               // PartyMember.id | EnemyInstance.instanceId
    initiative: number
    dexScore?: number           // desempate
    hidden?: boolean            // no se muestra en pantalla de jugador
}

// El combate vive DENTRO de cada encuentro (combats: Record<encounterId, EncounterCombat>).
export interface EncounterCombat {
    status: 'idle' | 'running'
    round: number
    turnIndex: number
    combatants: Combatant[]     // ordenados desc por initiative, desempate por dex
    enemyInstances: EnemyInstance[]
}
