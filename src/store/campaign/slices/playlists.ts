import { makeMutate, mutateCampaign } from '../helpers'
import type { CampaignSlice, CampaignState } from '../types'

export const createPlaylistsSlice: CampaignSlice<Pick<CampaignState,
    'addPlaylist' | 'removePlaylist' | 'renamePlaylist' |
    'addTrackToPlaylist' | 'removeTrackFromPlaylist' | 'reorderTracksInPlaylist' | 'updateTrackInPlaylist'
>> = (set) => {
    const mutate = makeMutate(set)
    return {
        addPlaylist: (campaignId, playlist) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            (c.playlists ??= []).push(playlist)
        })),
        removePlaylist: (campaignId, playlistId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            c.playlists = (c.playlists ?? []).filter((p) => p.id !== playlistId)
        })),
        renamePlaylist: (campaignId, playlistId, name) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const p = (c.playlists ?? []).find((pl) => pl.id === playlistId)
            if (p) p.name = name
        })),
        addTrackToPlaylist: (campaignId, playlistId, track) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const p = (c.playlists ?? []).find((pl) => pl.id === playlistId)
            if (p) p.tracks.push(track)
        })),
        removeTrackFromPlaylist: (campaignId, playlistId, trackId) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const p = (c.playlists ?? []).find((pl) => pl.id === playlistId)
            if (p) p.tracks = p.tracks.filter((t) => t.id !== trackId)
        })),
        reorderTracksInPlaylist: (campaignId, playlistId, tracks) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const p = (c.playlists ?? []).find((pl) => pl.id === playlistId)
            if (p) p.tracks = tracks
        })),
        updateTrackInPlaylist: (campaignId, playlistId, trackId, updates) => mutate((s) => mutateCampaign(s, campaignId, (c) => {
            const p = (c.playlists ?? []).find((pl) => pl.id === playlistId)
            if (!p) return
            const t = p.tracks.find((tr) => tr.id === trackId)
            if (t) Object.assign(t, updates)
        })),
    }
}
