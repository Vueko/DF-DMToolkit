import { describe, it, expect } from 'vitest'
import { viewerForPath } from './viewerForPath'

describe('viewerForPath', () => {
    it('maps by extension (case-insensitive)', () => {
        expect(viewerForPath('Notes/Intro.md')).toBe('markdown')
        expect(viewerForPath('maps/City.PNG')).toBe('image')
        expect(viewerForPath('a.jpeg')).toBe('image')
        expect(viewerForPath('Handout.pdf')).toBe('pdf')
        expect(viewerForPath('Homebrew/Class.docx')).toBe('doc')
    })
    it('defaults unknown / extension-less to markdown', () => {
        expect(viewerForPath('README')).toBe('markdown')
        expect(viewerForPath('weird.xyz')).toBe('markdown')
    })
})
