import { produce, type Draft } from 'immer'
import type { Campaign, Session } from '../../types'
import type { CampaignSet, CampaignState } from './types'

// Devuelve un `mutate(recipe)` ligado a `set` que aplica el recipe sobre un draft de immer.
export const makeMutate = (set: CampaignSet) =>
    (recipe: (state: Draft<CampaignState>) => void): void => set(produce(recipe))

// Encuentra la campaña en el draft y aplica fn; no-op si no existe.
export function mutateCampaign(
    state: Draft<CampaignState>,
    campaignId: string,
    fn: (c: Draft<Campaign>) => void,
): void {
    const c = state.campaigns.find((camp) => camp.id === campaignId)
    if (c) fn(c)
}

export function mutateSession(
    state: Draft<CampaignState>,
    campaignId: string,
    sessionId: string,
    fn: (s: Draft<Session>) => void,
): void {
    mutateCampaign(state, campaignId, (c) => {
        const s = c.sessions.find((sess) => sess.id === sessionId)
        if (s) fn(s)
    })
}
