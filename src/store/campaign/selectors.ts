import { useCampaignStore } from './index'
import type { Campaign, Session } from '../../types'

export const useCampaigns = (): Campaign[] => useCampaignStore((s) => s.campaigns)

export const useCurrentCampaign = (): Campaign | null =>
    useCampaignStore((s) => s.campaigns.find((c) => c.id === s.currentCampaignId) ?? null)

export const useCampaignById = (id: string | null): Campaign | null =>
    useCampaignStore((s) => (id ? s.campaigns.find((c) => c.id === id) ?? null : null))

export const useCurrentSession = (): Session | null =>
    useCampaignStore((s) => {
        const c = s.campaigns.find((camp) => camp.id === s.currentCampaignId)
        return c?.sessions.find((sess) => sess.id === s.currentSessionId) ?? null
    })
