import { describe, it, expect } from 'vitest'
import type { Campaign } from '../types'
import { STORE_KEYS } from '../../electron/mainSecurity'
import {
    APP_ID, FORMAT_VERSION, FULL_STORE_KEYS,
    buildFullExport, parseImport,
    mergeCampaignsById, mergeCampaignBlobs,
} from './backup'

const camp = (id: string): Campaign => ({ id, name: id, scenes: [], sessions: [], playlists: [] })
const AT = '2026-07-03T00:00:00.000Z'

describe('FULL_STORE_KEYS', () => {
    it('cubre todos los stores persistidos permitidos por el main process', () => {
        expect([...FULL_STORE_KEYS]).toEqual([...STORE_KEYS])
    })
})

describe('buildFullExport', () => {
    it('wraps present blobs in a versioned envelope and skips null ones', () => {
        const env = buildFullExport({ 'dnd-music': '{"state":{}}', 'dnd-campaigns': null }, AT)
        expect(env.app).toBe(APP_ID)
        expect(env.kind).toBe('full')
        expect(env.formatVersion).toBe(FORMAT_VERSION)
        expect(env.exportedAt).toBe(AT)
        expect(env.data['dnd-music']).toBe('{"state":{}}')
        expect('dnd-campaigns' in env.data).toBe(false)
    })
    it('strips vaultPath from dnd-settings but keeps other settings', () => {
        const settings = JSON.stringify({ state: { fontSize: 'lg', vaultPath: 'C:/secret' }, version: 1 })
        const env = buildFullExport({ 'dnd-settings': settings }, AT)
        const parsed = JSON.parse(env.data['dnd-settings'])
        expect(parsed.state.vaultPath).toBeUndefined()
        expect(parsed.state.fontSize).toBe('lg')
        expect(parsed.version).toBe(1)
    })
})

describe('parseImport', () => {
    it('recognizes a full envelope', () => {
        const raw = JSON.stringify({ app: APP_ID, kind: 'full', formatVersion: 1, exportedAt: AT, data: { 'dnd-music': '{}' } })
        expect(parseImport(raw)).toEqual({ kind: 'full', data: { 'dnd-music': '{}' }, legacy: false })
    })
    it('recognizes a legacy flat backup (no envelope)', () => {
        const raw = JSON.stringify({ 'dnd-campaigns': '{"state":{}}', unrelated: 1 })
        const r = parseImport(raw)
        expect(r.kind).toBe('full')
        if (r.kind === 'full') { expect(r.legacy).toBe(true); expect(r.data).toEqual({ 'dnd-campaigns': '{"state":{}}' }) }
    })
    it('rejects a raw array', () => {
        expect(parseImport(JSON.stringify([{ name: 'X' }])).kind).toBe('invalid')
    })
    it('rejects malformed JSON', () => {
        expect(parseImport('{not json').kind).toBe('invalid')
    })
    it('rejects an envelope from a wrong app', () => {
        const raw = JSON.stringify({ app: 'other', kind: 'full', formatVersion: 1, data: {} })
        expect(parseImport(raw).kind).toBe('invalid')
    })
    it('rejects a future formatVersion', () => {
        const raw = JSON.stringify({ app: APP_ID, kind: 'full', formatVersion: 999, data: {} })
        expect(parseImport(raw).kind).toBe('invalid')
    })
})

describe('mergeCampaignsById', () => {
    it('keeps existing and appends only new ids', () => {
        const merged = mergeCampaignsById([camp('a'), camp('b')], [camp('b'), camp('c')])
        expect(merged.map((c) => c.id)).toEqual(['a', 'b', 'c'])
    })
})

describe('mergeCampaignBlobs', () => {
    it('merges incoming campaigns into current and preserves current active refs', () => {
        const current = JSON.stringify({ state: { campaigns: [camp('a')], currentCampaignId: 'a', currentSessionId: 's1' }, version: 1 })
        const incoming = JSON.stringify({ state: { campaigns: [camp('a'), camp('b')], currentCampaignId: 'b', currentSessionId: null }, version: 1 })
        const out = JSON.parse(mergeCampaignBlobs(current, incoming))
        expect(out.state.campaigns.map((c: Campaign) => c.id)).toEqual(['a', 'b'])
        expect(out.state.currentCampaignId).toBe('a')
        expect(out.state.currentSessionId).toBe('s1')
        expect(out.version).toBe(1)
    })
    it('falls back to incoming when current is null', () => {
        const incoming = JSON.stringify({ state: { campaigns: [camp('x')] }, version: 1 })
        const out = JSON.parse(mergeCampaignBlobs(null, incoming))
        expect(out.state.campaigns.map((c: Campaign) => c.id)).toEqual(['x'])
        expect(out.state.currentCampaignId).toBeNull()
    })
})
