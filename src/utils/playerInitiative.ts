import type { EncounterCombat, PartyMember, PlayerInitiativePayload } from '../types'

// Proyección del combate para la pantalla de jugador: sin HP ni statblocks;
// los combatientes ocultos se muestran como "???".
export function buildInitiativePayload(
    combat: EncounterCombat,
    members: PartyMember[],
): PlayerInitiativePayload | null {
    if (combat.status !== 'running') return null
    const instanceById = new Map(combat.enemyInstances.map((i) => [i.instanceId, i]))
    const memberById = new Map(members.map((m) => [m.id, m]))
    return {
        round: combat.round,
        entries: combat.combatants.map((c, index) => ({
            kind: c.kind,
            active: index === combat.turnIndex,
            name: c.hidden
                ? '???'
                : c.kind === 'pc'
                    ? (memberById.get(c.refId)?.name || '—')
                    : (instanceById.get(c.refId)?.label ?? '—'),
        })),
    }
}
