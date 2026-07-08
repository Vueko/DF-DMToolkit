import { describe, it, expect } from 'vitest'
import { reduceUpdate, initialUpdateState } from './updateStore'

describe('reduceUpdate', () => {
    it('checking limpia error y dismissed', () => {
        const s = reduceUpdate({ ...initialUpdateState, error: 'x', dismissed: true }, { type: 'checking' })
        expect(s.status).toBe('checking')
        expect(s.error).toBeNull()
        expect(s.dismissed).toBe(false)
    })
    it('available fija version y limpia dismissed', () => {
        const s = reduceUpdate(initialUpdateState, { type: 'available', version: '1.2.0' })
        expect(s.status).toBe('available')
        expect(s.version).toBe('1.2.0')
        expect(s.dismissed).toBe(false)
    })
    it('not-available', () => {
        expect(reduceUpdate(initialUpdateState, { type: 'not-available' }).status).toBe('not-available')
    })
    it('progress → downloading + percent', () => {
        const s = reduceUpdate(initialUpdateState, { type: 'progress', percent: 42 })
        expect(s.status).toBe('downloading')
        expect(s.percent).toBe(42)
    })
    it('downloaded fija version y percent 100', () => {
        const s = reduceUpdate(initialUpdateState, { type: 'downloaded', version: '1.2.0' })
        expect(s.status).toBe('downloaded')
        expect(s.version).toBe('1.2.0')
        expect(s.percent).toBe(100)
    })
    it('error fija mensaje', () => {
        const s = reduceUpdate(initialUpdateState, { type: 'error', message: 'boom' })
        expect(s.status).toBe('error')
        expect(s.error).toBe('boom')
    })
})
