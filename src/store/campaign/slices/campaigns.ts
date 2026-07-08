import { makeMutate } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createCampaignsSlice: CampaignSlice<Pick<CampaignState,
    'addCampaign' | 'removeCampaign' | 'setCurrentCampaign'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addCampaign: (campaign) => mutate((s) => { s.campaigns.push(campaign) }),
        removeCampaign: (id) => mutate((s) => {
            s.campaigns = s.campaigns.filter((c) => c.id !== id)
            if (s.currentCampaignId === id) {
                s.currentCampaignId = null
                s.currentSessionId = null
            }
        }),
        setCurrentCampaign: (id) => mutate((s) => {
            s.currentCampaignId = id
            s.currentSessionId = null
        }),
    }
}
