import { describe, it, expect } from 'vitest'
import { extractFrontmatter, preprocessNoteMarkdown } from './noteMarkdown'

const noteIndex = new Map<string, string>([
  ['thornwall', 'Cities/Thornwall.md'],
  ['intro', 'Intro.md'],
])
const imageIndex = new Map<string, string>([['map.png', 'assets/map.png']])

describe('extractFrontmatter', () => {
  it('parses YAML frontmatter and strips it from body', () => {
    const res = extractFrontmatter('---\ntitle: Hi\ntags: [a, b]\n---\n# Body\n')
    expect(res.frontmatter).toEqual({ title: 'Hi', tags: ['a', 'b'] })
    expect(res.body).toBe('# Body\n')
  })
  it('returns null frontmatter when absent', () => {
    const res = extractFrontmatter('# Body')
    expect(res.frontmatter).toBeNull()
    expect(res.body).toBe('# Body')
  })
})

describe('preprocessNoteMarkdown', () => {
  it('resolves a wikilink to a markdown link (angle-wrapped url)', () => {
    expect(preprocessNoteMarkdown('See [[Thornwall]].', noteIndex, imageIndex))
      .toBe('See [Thornwall](<vault-note:Cities/Thornwall.md>).')
  })
  it('uses alias as display text', () => {
    expect(preprocessNoteMarkdown('[[Thornwall|the city]]', noteIndex, imageIndex))
      .toBe('[the city](<vault-note:Cities/Thornwall.md>)')
  })
  it('keeps heading in the url', () => {
    expect(preprocessNoteMarkdown('[[Thornwall#History]]', noteIndex, imageIndex))
      .toBe('[Thornwall](<vault-note:Cities/Thornwall.md#History>)')
  })
  it('leaves broken links literal', () => {
    expect(preprocessNoteMarkdown('[[Unknown]]', noteIndex, imageIndex)).toBe('[[Unknown]]')
  })
  it('resolves image embeds (angle-wrapped url)', () => {
    expect(preprocessNoteMarkdown('![[map.png]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('strips the size suffix from image embeds', () => {
    expect(preprocessNoteMarkdown('![[map.png|200]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('resolves subpath image embeds by basename', () => {
    expect(preprocessNoteMarkdown('![[sub/folder/map.png]]', noteIndex, imageIndex))
      .toBe('![map.png](<vault-img:assets/map.png>)')
  })
  it('handles note paths with spaces', () => {
    const ni = new Map([['casa dragoon', 'Mundo/Casa Dragoon/Casa Dragoon.md']])
    expect(preprocessNoteMarkdown('[[Casa Dragoon]]', ni, imageIndex))
      .toBe('[Casa Dragoon](<vault-note:Mundo/Casa Dragoon/Casa Dragoon.md>)')
  })
  it('does not transform inside fenced code blocks', () => {
    const md = '```\n[[Thornwall]]\n```'
    expect(preprocessNoteMarkdown(md, noteIndex, imageIndex)).toBe(md)
  })
  it('does not transform inside inline code spans', () => {
    expect(preprocessNoteMarkdown('use `[[Thornwall]]` literally', noteIndex, imageIndex))
      .toBe('use `[[Thornwall]]` literally')
  })
  it('still transforms links outside inline code on the same line', () => {
    expect(preprocessNoteMarkdown('`code` and [[Thornwall]]', noteIndex, imageIndex))
      .toBe('`code` and [Thornwall](<vault-note:Cities/Thornwall.md>)')
  })
})
