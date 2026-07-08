import { makeMutate, mutateCampaign } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createMapSlice: CampaignSlice<Pick<CampaignState,
    'updateCampaignMap' | 'setActiveMap' | 'addMapLibraryEntry' | 'removeMapLibraryEntry' |
    'setActiveMapRotation' | 'addPlayerScreenImage' | 'removePlayerScreenImage'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        updateCampaignMap: (campaignId, mapData) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            if (!c.map) c.map = { markers: [], path: [] }
            Object.assign(c.map, mapData)
        })),
        setActiveMap: (campaignId, storedId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.activeMapStoredId = storedId
        })),
        addMapLibraryEntry: (campaignId, entry) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            (c.mapLibrary ??= []).push(entry)
        })),
        removeMapLibraryEntry: (campaignId, entryId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const entry = (c.mapLibrary ?? []).find((e) => e.id === entryId)
            c.mapLibrary = (c.mapLibrary ?? []).filter((e) => e.id !== entryId)
            if (entry && c.activeMapStoredId === entry.storedId) c.activeMapStoredId = null
        })),
        setActiveMapRotation: (campaignId, rotation) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.activeMapRotation = rotation
        })),
        addPlayerScreenImage: (campaignId, image) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            (c.playerScreenImages ??= []).push(image)
        })),
        removePlayerScreenImage: (campaignId, imageId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.playerScreenImages = (c.playerScreenImages ?? []).filter((img) => img.id !== imageId)
        })),
    }
}
