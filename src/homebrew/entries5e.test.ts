import { describe, it, expect } from 'vitest'
import { flattenEntries } from './entries5e'

describe('flattenEntries', () => {
    it('strings con tags', () => {
        expect(flattenEntries(['Deals {@damage 1d6} cold damage.'])).toBe('Deals 1d6 cold damage.')
    })
    it('entries con nombre → negrita + texto', () => {
        expect(flattenEntries([{ type: 'entries', name: 'Lore', entries: ['Detail.'] }]))
            .toContain('**Lore.** Detail.')
    })
    it('lista', () => {
        const out = flattenEntries([{ type: 'list', items: ['{@b A}: one', 'two'] }])
        expect(out).toContain('- **A**: one')
        expect(out).toContain('- two')
    })
    it('tabla a markdown', () => {
        const out = flattenEntries([{
            type: 'table', colLabels: ['Roll', 'Type'],
            rows: [[{ type: 'cell', roll: { exact: 1 } }, 'Acid'], ['2', 'Cold']],
        }])
        expect(out).toContain('| Roll | Type |')
        expect(out).toContain('| 1 | Acid |')
        expect(out).toContain('| 2 | Cold |')
    })
    it('tipos desconocidos se ignoran sin romper', () => {
        expect(flattenEntries([{ type: 'image', href: {} }, 'Sigue'])).toBe('Sigue')
    })
})
