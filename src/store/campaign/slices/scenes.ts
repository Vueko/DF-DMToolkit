import { makeMutate, mutateCampaign } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createScenesSlice: CampaignSlice<Pick<CampaignState,
    'addScene' | 'updateScene' | 'removeScene'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addScene: (campaignId, scene) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.scenes.push(scene)
        })),
        updateScene: (campaignId, sceneId, updates) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const sc = c.scenes.find((x) => x.id === sceneId)
            if (sc) Object.assign(sc, updates)
        })),
        removeScene: (campaignId, sceneId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.scenes = c.scenes.filter((sc) => sc.id !== sceneId)
            c.sessions.forEach((sess) => {
                sess.sceneIds = sess.sceneIds.filter((id) => id !== sceneId)
            })
        })),
    }
}
