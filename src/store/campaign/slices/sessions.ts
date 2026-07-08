import { makeMutate, mutateCampaign, mutateSession } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createSessionsSlice: CampaignSlice<Pick<CampaignState,
    'addSession' | 'removeSession' | 'setCurrentSession' |
    'addSceneToSession' | 'removeSceneFromSession' |
    'addEncounterToSession' | 'removeEncounterFromSession'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addSession: (campaignId, session) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.sessions.push(session)
        })),
        removeSession: (campaignId, sessionId) => mutate((s) => {
            mutateCampaign(s, campaignId, (c) => {
                c.sessions = c.sessions.filter((sess) => sess.id !== sessionId)
            })
            if (s.currentSessionId === sessionId) s.currentSessionId = null
        }),
        setCurrentSession: (campaignId, sessionId) => mutate((s) => {
            s.currentCampaignId = campaignId
            s.currentSessionId = sessionId
        }),
        addSceneToSession: (campaignId, sessionId, sceneId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            if (!sess.sceneIds.includes(sceneId)) sess.sceneIds.push(sceneId)
        })),
        removeSceneFromSession: (campaignId, sessionId, sceneId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.sceneIds = sess.sceneIds.filter((id) => id !== sceneId)
        })),
        addEncounterToSession: (campaignId, sessionId, encounterId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.encounterIds ??= []
            if (!sess.encounterIds.includes(encounterId)) sess.encounterIds.push(encounterId)
        })),
        removeEncounterFromSession: (campaignId, sessionId, encounterId) => mutate((s) => mutateSession(s, campaignId, sessionId, (sess) => {
            sess.encounterIds = (sess.encounterIds ?? []).filter((id) => id !== encounterId)
        })),
    }
}
