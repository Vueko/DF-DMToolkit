import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { electronStorage } from '../utils/electronStorage'
import { createMigrate } from './persistMigration'
import type { PartyMember } from '../types'

interface PartyState {
    membersByCampaign: Record<string, PartyMember[]>
    addMember: (campaignId: string, member: PartyMember) => void
    updateMember: (campaignId: string, id: string, updates: Partial<PartyMember>) => void
    removeMember: (campaignId: string, id: string) => void
    decrementConditionRounds: (campaignId: string) => void
}

// Referencia estable para el caso vacío: los selectores de zustand v5 usan
// useSyncExternalStore, y un `[]` nuevo por snapshot provoca re-render infinito.
const EMPTY_MEMBERS: PartyMember[] = []

export const partyOf = (
    state: Pick<PartyState, 'membersByCampaign'>,
    campaignId: string | null | undefined,
): PartyMember[] =>
    (campaignId ? state.membersByCampaign[campaignId] : undefined) ?? EMPTY_MEMBERS

export const usePartyStore = create<PartyState>()(
    persist(
        (set) => {
            const mutate = (campaignId: string, fn: (members: PartyMember[]) => PartyMember[]) =>
                set((s) => ({
                    membersByCampaign: { ...s.membersByCampaign, [campaignId]: fn(s.membersByCampaign[campaignId] ?? []) },
                }))
            return {
                membersByCampaign: {},
                addMember: (campaignId, member) => mutate(campaignId, (ms) => [...ms, member]),
                updateMember: (campaignId, id, updates) => mutate(campaignId, (ms) =>
                    ms.map((m) => (m.id === id ? { ...m, ...updates } : m))),
                removeMember: (campaignId, id) => mutate(campaignId, (ms) => ms.filter((m) => m.id !== id)),
                decrementConditionRounds: (campaignId) => mutate(campaignId, (ms) =>
                    ms.map((m) => ({
                        ...m,
                        conditions: m.conditions.map((c) =>
                            c.roundsLeft === undefined ? c : { ...c, roundsLeft: Math.max(0, c.roundsLeft - 1) }),
                    }))),
            }
        },
        { name: 'dnd-party', version: 1, migrate: createMigrate<PartyState>(1, {}), storage: createJSONStorage(() => electronStorage) }
    )
)
