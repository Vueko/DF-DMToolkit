import { describe, it, expect } from 'vitest'
import { migrateCampaignsV1toV2 } from './index'

describe('migrateCampaignsV1toV2', () => {
    it('elimina cardInstances, encounters y los campos fear de escenas', () => {
        const v1 = {
            campaigns: [{
                id: 'c1', name: 'C',
                scenes: [
                    { id: 'sc1', title: 'S', status: 'upcoming', flag: 'f', flagType: 'fear', fearThreshold: 8, count: 0 },
                    { id: 'sc2', title: 'S2', status: 'active', flag: '', flagType: 'time', count: 1 },
                ],
                sessions: [{ id: 's1', name: 'S', number: 1, sceneIds: [], encounterIds: ['e1'], cardInstances: [{ instanceId: 'i1' }] }],
                playlists: [],
                encounters: [{ id: 'e1', name: 'E', pcCount: 4, adjustments: [], entries: [] }],
                activeEncounterId: 'e1',
            }],
            currentCampaignId: 'c1',
            currentSessionId: null,
        }
        const out = migrateCampaignsV1toV2(v1) as typeof v1
        const c = out.campaigns[0] as Record<string, unknown>
        expect(c.encounters).toBeUndefined()
        expect(c.activeEncounterId).toBeUndefined()
        const sess = (c.sessions as Record<string, unknown>[])[0]
        expect(sess.cardInstances).toBeUndefined()
        expect(sess.encounterIds).toEqual([])
        const [sc1, sc2] = c.scenes as Record<string, unknown>[]
        expect(sc1.flagType).toBe('event')
        expect(sc1.fearThreshold).toBeUndefined()
        expect(sc2.flagType).toBe('time')
        expect(out.currentCampaignId).toBe('c1')
    })
    it('tolera estados raros sin lanzar', () => {
        expect(migrateCampaignsV1toV2(null)).toBeNull()
        expect(migrateCampaignsV1toV2({})).toEqual({})
    })
})
