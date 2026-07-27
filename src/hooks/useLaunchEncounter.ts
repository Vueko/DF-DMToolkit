import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Encounter } from '../types'
import { useCampaignStore } from '../store/campaignStore'
import { useBestiaryStore } from '../store/bestiaryStore'
import { useCombatStore, combatOf } from '../store/combatStore'
import { usePartyStore, partyOf } from '../store/partyStore'
import { useSrd } from '../srd/useSrd'
import { open5eCreatureToMonster } from '../srd/open5eCreatureToMonster'
import { buildEnemyGroup } from '../utils/combat'

// Lanza un encuentro desde una escena: lo activa, prepara su combate si está
// vacío (party + entradas expandidas) y navega al Dashboard, donde se dirige.
export function useLaunchEncounter() {
    const navigate = useNavigate()
    const { data } = useSrd<unknown[]>('creatures')
    const homebrew = useBestiaryStore((s) => s.monsters)
    const monstersById = useMemo(
        () => new Map([...homebrew, ...(data ?? []).map(open5eCreatureToMonster)].map((m) => [m.id, m])),
        [homebrew, data],
    )

    return useCallback((encounter: Encounter, campaignId: string) => {
        useCampaignStore.getState().setActiveEncounter(campaignId, encounter.id)
        const store = useCombatStore.getState()
        if (combatOf(store, encounter.id).combatants.length === 0) {
            const members = partyOf(usePartyStore.getState(), campaignId)
            store.addCombatants(encounter.id, members.map((m) => ({ id: m.id, kind: 'pc' as const, refId: m.id, initiative: 0 })))
            let existing = combatOf(useCombatStore.getState(), encounter.id).enemyInstances
            for (const entry of encounter.entries) {
                const monster = monstersById.get(entry.monsterId)
                if (!monster) continue
                const group = buildEnemyGroup(monster, entry.count, existing)
                existing = [...existing, ...group.instances]
                useCombatStore.getState().addCombatants(encounter.id, group.combatants, group.instances)
            }
            useCombatStore.getState().rollEnemyInitiative(encounter.id)
        }
        navigate('/')
    }, [monstersById, navigate])
}
