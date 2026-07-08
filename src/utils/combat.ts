import type { Monster, EnemyInstance, Combatant, PartyMember } from '../types'

export function d20(rng: () => number = Math.random): number {
    return Math.floor(rng() * 20) + 1
}

// Crea `count` instancias de un monstruo con etiquetas numeradas que continúan
// las existentes ("Goblin 3" si ya hay dos), y sus combatants enlazados.
export function buildEnemyGroup(
    monster: Monster,
    count: number,
    existing: EnemyInstance[],
    makeId: () => string = () => crypto.randomUUID(),
): { instances: EnemyInstance[]; combatants: Combatant[] } {
    const startAt = existing.filter((e) => e.monsterId === monster.id).length
    const hasLegendary = monster.legendaryActions.length > 0
    const instances: EnemyInstance[] = []
    const combatants: Combatant[] = []
    for (let i = 0; i < count; i++) {
        const instanceId = makeId()
        instances.push({
            instanceId,
            monsterId: monster.id,
            label: `${monster.name} ${startAt + i + 1}`,
            hpCurrent: monster.hp.average,
            hpMax: monster.hp.average,
            conditions: [],
            ...(hasLegendary ? { legendaryActionsMax: 3, legendaryActionsLeft: 3 } : {}),
            ...(monster.legendaryResistance !== undefined
                ? { legendaryResistanceMax: monster.legendaryResistance, legendaryResistanceLeft: monster.legendaryResistance }
                : {}),
        })
        combatants.push({ id: instanceId, kind: 'enemy', refId: instanceId, initiative: 0, dexScore: monster.stats.dex })
    }
    return { instances, combatants }
}

// Aplica daño (delta negativo) o curación (positivo) con vida temporal 5e:
// el daño consume primero los THP; la curación no los toca.
export function applyDamage(
    hpCurrent: number,
    hpMax: number,
    tempHp: number,
    delta: number,
): { hpCurrent: number; tempHp: number } {
    if (delta >= 0) {
        return { hpCurrent: Math.min(hpMax, hpCurrent + delta), tempHp }
    }
    const damage = -delta
    const fromTemp = Math.min(tempHp, damage)
    const remaining = damage - fromTemp
    return {
        hpCurrent: Math.max(0, hpCurrent - remaining),
        tempHp: tempHp - fromTemp,
    }
}

export function isBloodied(hpCurrent: number, hpMax: number): boolean {
    return hpCurrent > 0 && hpCurrent <= Math.floor(hpMax / 2)
}

export type DeathSaveStatus = 'dying' | 'stable' | 'dead'

export function deathSaveStatus(successes: number, failures: number): DeathSaveStatus {
    if (failures >= 3) return 'dead'
    if (successes >= 3) return 'stable'
    return 'dying'
}

export interface PcHpUpdate {
    hpCurrent: number
    tempHp: number
    deathSaves?: { successes: number; failures: number }
}

// Aplica daño/curación a un PJ gestionando la agonía a 0 HP (regla 5e).
export function applyPcHp(
    member: Pick<PartyMember, 'hpCurrent' | 'maxHp' | 'tempHp' | 'deathSaves'>,
    delta: number,
): PcHpUpdate {
    const maxHp = member.maxHp ?? 0
    const before = member.hpCurrent ?? maxHp
    const { hpCurrent, tempHp } = applyDamage(before, maxHp, member.tempHp ?? 0, delta)

    // Curación que devuelve al PJ a vida positiva: fin de la agonía.
    if (hpCurrent > 0) return { hpCurrent, tempHp }

    // Sigue (o queda) a 0 HP.
    const wasDown = before === 0
    if (!wasDown) {
        // Acaba de caer: inconsciente, sin fallos aún.
        return { hpCurrent, tempHp, deathSaves: { successes: 0, failures: 0 } }
    }
    // Ya estaba a 0 y recibe daño: fallo (o muerte directa si el golpe >= maxHp).
    const current = member.deathSaves ?? { successes: 0, failures: 0 }
    if (delta < 0) {
        const massive = -delta >= maxHp && maxHp > 0
        const failures = massive ? 3 : Math.min(3, current.failures + 1)
        return { hpCurrent, tempHp, deathSaves: { ...current, failures } }
    }
    // Curación de 0 a 0 (p.ej. +0): conserva estado.
    return { hpCurrent, tempHp, deathSaves: current }
}

export function sortCombatants(combatants: Combatant[]): Combatant[] {
    return [...combatants].sort((a, b) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative
        return (b.dexScore ?? -Infinity) - (a.dexScore ?? -Infinity)
    })
}
