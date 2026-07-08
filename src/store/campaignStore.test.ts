import { describe, it, expect, beforeEach } from 'vitest'
import { useCampaignStore } from './campaignStore'
import type {
    Campaign, Scene, Session, Track, Playlist, Encounter,
} from '../types'

const get = () => useCampaignStore.getState()
const camp = () => get().campaigns[0]

const mkCampaign = (id = 'c1'): Campaign => ({ id, name: 'C', scenes: [], sessions: [], playlists: [] })
const mkScene = (id: string): Scene => ({ id, title: 'S', status: 'upcoming', flag: '', count: 0 })
const mkSession = (id: string): Session => ({ id, name: 'Sess', number: 1, sceneIds: [], encounterIds: [] })
const mkTrack = (id: string): Track => ({ id, title: 'T', artist: 'A', storedId: 'st-' + id })
const mkPlaylist = (id: string): Playlist => ({ id, name: 'P', tracks: [] })
const mkEncounter = (id: string): Encounter => ({ id, name: 'E', entries: [] })

beforeEach(() => {
    useCampaignStore.setState({ campaigns: [], currentCampaignId: null, currentSessionId: null })
})

describe('campaigns', () => {
    it('addCampaign appends', () => {
        get().addCampaign(mkCampaign('c1'))
        expect(get().campaigns.map((c) => c.id)).toEqual(['c1'])
    })
    it('setCurrentCampaign sets the id and clears the current session', () => {
        get().addCampaign(mkCampaign('c1'))
        useCampaignStore.setState({ currentSessionId: 's1' })
        get().setCurrentCampaign('c1')
        expect(get().currentCampaignId).toBe('c1')
        expect(get().currentSessionId).toBeNull()
    })
    it('removeCampaign removes it and clears matching current refs', () => {
        get().addCampaign(mkCampaign('c1'))
        get().setCurrentCampaign('c1')
        useCampaignStore.setState({ currentSessionId: 's1' })
        get().removeCampaign('c1')
        expect(get().campaigns).toEqual([])
        expect(get().currentCampaignId).toBeNull()
        expect(get().currentSessionId).toBeNull()
    })
})

describe('sessions', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('addSession appends', () => {
        get().addSession('c1', mkSession('s1'))
        expect(camp().sessions.map((s) => s.id)).toEqual(['s1'])
    })
    it('removeSession removes it and clears currentSessionId', () => {
        get().addSession('c1', mkSession('s1'))
        useCampaignStore.setState({ currentSessionId: 's1' })
        get().removeSession('c1', 's1')
        expect(camp().sessions).toEqual([])
        expect(get().currentSessionId).toBeNull()
    })
    it('setCurrentSession sets both ids', () => {
        get().addSession('c1', mkSession('s1'))
        get().setCurrentSession('c1', 's1')
        expect(get().currentCampaignId).toBe('c1')
        expect(get().currentSessionId).toBe('s1')
    })
    it('addSceneToSession adds without duplicating', () => {
        get().addSession('c1', mkSession('s1'))
        get().addSceneToSession('c1', 's1', 'sc1')
        get().addSceneToSession('c1', 's1', 'sc1')
        expect(camp().sessions[0].sceneIds).toEqual(['sc1'])
    })
    it('removeSceneFromSession removes the id', () => {
        get().addSession('c1', { ...mkSession('s1'), sceneIds: ['sc1', 'sc2'] })
        get().removeSceneFromSession('c1', 's1', 'sc1')
        expect(camp().sessions[0].sceneIds).toEqual(['sc2'])
    })
})

describe('scenes', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('addScene and updateScene', () => {
        get().addScene('c1', mkScene('sc1'))
        expect(camp().scenes.map((s) => s.id)).toEqual(['sc1'])
        get().updateScene('c1', 'sc1', { title: 'New' })
        expect(camp().scenes[0].title).toBe('New')
    })
    it('removeScene cascades: removes the sceneId from every session', () => {
        get().addScene('c1', mkScene('sc1'))
        get().addSession('c1', { ...mkSession('s1'), sceneIds: ['sc1', 'sc2'] })
        get().removeScene('c1', 'sc1')
        expect(camp().scenes).toEqual([])
        expect(camp().sessions[0].sceneIds).toEqual(['sc2'])
    })
})

describe('playlists', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('add, rename and remove', () => {
        get().addPlaylist('c1', mkPlaylist('p1'))
        expect(camp().playlists.map((p) => p.id)).toEqual(['p1'])
        get().renamePlaylist('c1', 'p1', 'Combat')
        expect(camp().playlists[0].name).toBe('Combat')
        get().removePlaylist('c1', 'p1')
        expect(camp().playlists).toEqual([])
    })
    it('track add, reorder, update and remove', () => {
        get().addPlaylist('c1', mkPlaylist('p1'))
        get().addTrackToPlaylist('c1', 'p1', mkTrack('t1'))
        get().addTrackToPlaylist('c1', 'p1', mkTrack('t2'))
        expect(camp().playlists[0].tracks.map((t) => t.id)).toEqual(['t1', 't2'])
        get().reorderTracksInPlaylist('c1', 'p1', [mkTrack('t2'), mkTrack('t1')])
        expect(camp().playlists[0].tracks.map((t) => t.id)).toEqual(['t2', 't1'])
        get().updateTrackInPlaylist('c1', 'p1', 't1', { title: 'Renamed' })
        expect(camp().playlists[0].tracks.find((t) => t.id === 't1')?.title).toBe('Renamed')
        get().removeTrackFromPlaylist('c1', 'p1', 't2')
        expect(camp().playlists[0].tracks.map((t) => t.id)).toEqual(['t1'])
    })
})

describe('map', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('updateCampaignMap merges keeping markers/path', () => {
        get().updateCampaignMap('c1', { image: 'img' })
        expect(camp().map).toMatchObject({ image: 'img', markers: [], path: [] })
    })
    it('setActiveMap and setActiveMapRotation', () => {
        get().setActiveMap('c1', 'map-a')
        expect(camp().activeMapStoredId).toBe('map-a')
        get().setActiveMapRotation('c1', 90)
        expect(camp().activeMapRotation).toBe(90)
    })
    it('removeMapLibraryEntry cascades: clears activeMapStoredId when it matched', () => {
        get().addMapLibraryEntry('c1', { id: 'm1', name: 'Map', storedId: 'stored-1' })
        expect(camp().mapLibrary?.map((m) => m.id)).toEqual(['m1'])
        get().setActiveMap('c1', 'stored-1')
        get().removeMapLibraryEntry('c1', 'm1')
        expect(camp().mapLibrary).toEqual([])
        expect(camp().activeMapStoredId).toBeNull()
    })
})

describe('encounters', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('add, update and setActive', () => {
        get().addEncounter('c1', mkEncounter('e1'))
        expect(camp().encounters?.map((e) => e.id)).toEqual(['e1'])
        get().updateEncounter('c1', 'e1', { name: 'Boss' })
        expect(camp().encounters?.[0].name).toBe('Boss')
        get().setActiveEncounter('c1', 'e1')
        expect(camp().activeEncounterId).toBe('e1')
    })
    it('removeEncounter cascades: clears active and removes from sessions', () => {
        get().addEncounter('c1', mkEncounter('e1'))
        get().addSession('c1', { ...mkSession('s1'), encounterIds: ['e1', 'e2'] })
        get().setActiveEncounter('c1', 'e1')
        get().removeEncounter('c1', 'e1')
        expect(camp().encounters).toEqual([])
        expect(camp().activeEncounterId).toBeUndefined()
        expect(camp().sessions[0].encounterIds).toEqual(['e2'])
    })
    it('add/removeEncounterToSession (no duplicate)', () => {
        get().addEncounter('c1', mkEncounter('e1'))
        get().addSession('c1', mkSession('s1'))
        get().addEncounterToSession('c1', 's1', 'e1')
        get().addEncounterToSession('c1', 's1', 'e1')
        expect(camp().sessions[0].encounterIds).toEqual(['e1'])
        get().removeEncounterFromSession('c1', 's1', 'e1')
        expect(camp().sessions[0].encounterIds).toEqual([])
    })
})

describe('player screen images', () => {
    beforeEach(() => get().addCampaign(mkCampaign('c1')))
    it('add and remove', () => {
        get().addPlayerScreenImage('c1', { id: 'pi1', name: 'Img', storedId: 'st' })
        expect(camp().playerScreenImages?.map((i) => i.id)).toEqual(['pi1'])
        get().removePlayerScreenImage('c1', 'pi1')
        expect(camp().playerScreenImages).toEqual([])
    })
})
