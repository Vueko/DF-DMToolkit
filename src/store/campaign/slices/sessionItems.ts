import { makeMutate, mutateSession } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createSessionItemsSlice: CampaignSlice<Pick<CampaignState,
    'addSessionItem' | 'updateSessionItem' | 'removeSessionItem'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addSessionItem: (campaignId, sessionId, item) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.items ??= []
            sess.items.push(item)
        })),
        updateSessionItem: (campaignId, sessionId, itemId, updates) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            const it = sess.items?.find((i) => i.id === itemId)
            if (it) Object.assign(it, updates)
        })),
        removeSessionItem: (campaignId, sessionId, itemId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.items = (sess.items ?? []).filter((i) => i.id !== itemId)
        })),
    }
}
