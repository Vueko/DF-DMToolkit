import { makeMutate, mutateCampaign } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createEncountersSlice: CampaignSlice<Pick<CampaignState,
    'addEncounter' | 'removeEncounter' | 'updateEncounter' | 'setActiveEncounter'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addEncounter: (campaignId, encounter) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            (c.encounters ??= []).push(encounter)
        })),
        removeEncounter: (campaignId, encounterId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.encounters = (c.encounters ?? []).filter((e) => e.id !== encounterId)
            if (c.activeEncounterId === encounterId) c.activeEncounterId = undefined
            c.sessions.forEach((sess) => {
                sess.encounterIds = (sess.encounterIds ?? []).filter((id) => id !== encounterId)
            })
        })),
        updateEncounter: (campaignId, encounterId, updates) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const e = (c.encounters ?? []).find((enc) => enc.id === encounterId)
            if (e) Object.assign(e, updates)
        })),
        setActiveEncounter: (campaignId, encounterId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.activeEncounterId = encounterId ?? undefined
        })),
    }
}
