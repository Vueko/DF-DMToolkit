import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { transformCallouts } from './remarkCallouts'

// Regression: real remark output keeps "[!type] title\nbody" as ONE text node
// joined by "\n" (not separate text/break nodes), so the marker regex must not
// anchor to end-of-string.
describe('transformCallouts on real parsed markdown', () => {
    it('detects a callout whose body is soft-wrapped on the next line', () => {
        const tree = unified().use(remarkParse).parse('> [!warning] Cuidado\n> El texto.') as never
        transformCallouts(tree)
        const bq = (tree as { children: { data?: { hName?: string; hProperties?: Record<string, unknown> } }[] }).children[0]
        expect(bq.data?.hName).toBe('div')
        expect(bq.data?.hProperties?.className).toEqual(['callout', 'callout-warning'])
        expect(bq.data?.hProperties?.dataCalloutTitle).toBe('Cuidado')
    })

    it('keeps the body text (without the marker line)', () => {
        const tree = unified().use(remarkParse).parse('> [!info] Hola\n> Cuerpo.') as never
        transformCallouts(tree)
        const para = (tree as { children: { children: { children: { value?: string }[] }[] }[] }).children[0].children[0]
        expect(para.children.map((c) => c.value).join('')).toContain('Cuerpo.')
        expect(para.children.map((c) => c.value).join('')).not.toContain('[!info]')
    })
})

// Minimal mdast builders
const text = (value: string) => ({ type: 'text', value })
const brk = () => ({ type: 'break' })
const para = (...children: unknown[]) => ({ type: 'paragraph', children })
const quote = (...children: unknown[]) => ({ type: 'blockquote', children })
const root = (...children: unknown[]) => ({ type: 'root', children })

describe('transformCallouts', () => {
    it('tags a callout blockquote and strips the marker line', () => {
        const tree = root(quote(para(text('[!warning] Be careful'), brk(), text('body line'))))
        transformCallouts(tree as never)
        const bq = (tree.children[0] as { data?: { hName?: string; hProperties?: Record<string, unknown> }; children: { children: unknown[] }[] })
        expect(bq.data?.hName).toBe('div')
        expect(bq.data?.hProperties).toMatchObject({
            dataCalloutTitle: 'Be careful',
            className: ['callout', 'callout-warning'],
        })
        // marker text + break removed; body remains
        expect(bq.children[0].children).toEqual([text('body line')])
    })

    it('lowercases the type and supports types like danger/info', () => {
        const tree = root(quote(para(text('[!DANGER]'))))
        transformCallouts(tree as never)
        const bq = tree.children[0] as { data?: { hProperties?: Record<string, unknown> }; children: unknown[] }
        expect(bq.data?.hProperties?.className).toEqual(['callout', 'callout-danger'])
        expect(bq.data?.hProperties?.dataCalloutTitle).toBe('')
        // title-only callout: empty first paragraph removed
        expect(bq.children.length).toBe(0)
    })

    it('handles a blank-line callout body (separate paragraph)', () => {
        const tree = root(quote(para(text('[!info] Heads up')), para(text('the body'))))
        transformCallouts(tree as never)
        const bq = tree.children[0] as { data?: { hProperties?: Record<string, unknown> }; children: { children: unknown[] }[] }
        expect(bq.data?.hProperties?.className).toEqual(['callout', 'callout-info'])
        expect(bq.children.length).toBe(1)
        expect(bq.children[0].children).toEqual([text('the body')])
    })

    it('ignores normal blockquotes', () => {
        const tree = root(quote(para(text('just a quote'))))
        transformCallouts(tree as never)
        const bq = tree.children[0] as { data?: unknown }
        expect(bq.data).toBeUndefined()
    })

    it('ignores fold markers in the type line', () => {
        const tree = root(quote(para(text('[!tip]+ Pro tip'))))
        transformCallouts(tree as never)
        const bq = tree.children[0] as { data?: { hProperties?: Record<string, unknown> } }
        expect(bq.data?.hProperties?.className).toEqual(['callout', 'callout-tip'])
        expect(bq.data?.hProperties?.dataCalloutTitle).toBe('Pro tip')
    })
})
