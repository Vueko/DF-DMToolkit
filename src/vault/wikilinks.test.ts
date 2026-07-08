import { describe, it, expect } from 'vitest'
import type { VaultNode } from '../types'
import { parseWikiTarget, listNotes, buildNoteIndex, buildImageIndex, resolveNote } from './wikilinks'

const tree: VaultNode = {
  name: 'vault', path: '', type: 'folder', children: [
    { name: 'Cities', path: 'Cities', type: 'folder', children: [
      { name: 'Thornwall.md', path: 'Cities/Thornwall.md', type: 'note' },
    ] },
    { name: 'Intro.md', path: 'Intro.md', type: 'note' },
    { name: 'map.png', path: 'map.png', type: 'image' },
  ],
}

describe('parseWikiTarget', () => {
  it('parses a plain name', () => {
    expect(parseWikiTarget('Thornwall')).toEqual({ name: 'Thornwall', heading: null, alias: null })
  })
  it('parses alias', () => {
    expect(parseWikiTarget('Thornwall|the city')).toEqual({ name: 'Thornwall', heading: null, alias: 'the city' })
  })
  it('parses heading', () => {
    expect(parseWikiTarget('Thornwall#History')).toEqual({ name: 'Thornwall', heading: 'History', alias: null })
  })
  it('parses heading + alias', () => {
    expect(parseWikiTarget('Thornwall#History|past')).toEqual({ name: 'Thornwall', heading: 'History', alias: 'past' })
  })
  it('trims whitespace', () => {
    expect(parseWikiTarget('  Thornwall  ')).toEqual({ name: 'Thornwall', heading: null, alias: null })
  })
  it('treats an empty heading as null', () => {
    expect(parseWikiTarget('Thornwall#|past')).toEqual({ name: 'Thornwall', heading: null, alias: 'past' })
  })
})

describe('listNotes', () => {
  it('returns all notes with basename and path', () => {
    expect(listNotes(tree)).toEqual([
      { name: 'Thornwall', path: 'Cities/Thornwall.md' },
      { name: 'Intro', path: 'Intro.md' },
    ])
  })
  it('handles null', () => {
    expect(listNotes(null)).toEqual([])
  })
})

describe('buildNoteIndex / resolveNote', () => {
  const index = buildNoteIndex(tree)
  it('resolves by basename case-insensitively', () => {
    expect(resolveNote(index, 'thornwall')).toBe('Cities/Thornwall.md')
    expect(resolveNote(index, 'Intro')).toBe('Intro.md')
  })
  it('returns null for unknown', () => {
    expect(resolveNote(index, 'Nope')).toBeNull()
  })
})

describe('buildImageIndex', () => {
  it('indexes images by filename', () => {
    expect(buildImageIndex(tree).get('map.png')).toBe('map.png')
  })
  it('lowercases image keys so mixed-case filenames resolve', () => {
    const mixed: VaultNode = {
      name: 'v', path: '', type: 'folder', children: [
        { name: 'Hero.PNG', path: 'art/Hero.PNG', type: 'image' },
      ],
    }
    expect(buildImageIndex(mixed).get('hero.png')).toBe('art/Hero.PNG')
  })
})
