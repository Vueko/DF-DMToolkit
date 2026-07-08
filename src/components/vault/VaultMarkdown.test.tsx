import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import { VaultMarkdown } from './VaultMarkdown'

// Integration test of the real react-markdown pipeline (remark-gfm +
// remark-callouts + custom components).
//
// NOTE: callouts and GFM tables do NOT depend on the vault store, so they render
// correctly under renderToStaticMarkup. Wikilink/image resolution DOES depend on
// the store's index, which renderToStaticMarkup cannot see (Zustand's server
// snapshot returns the initial empty state) — that path is covered by
// preprocessNoteMarkdown's unit tests, plus the standalone angle-link test below
// that proves react-markdown turns "[x](<url with spaces>)" into a real anchor.

function render(body: string): string {
    return renderToStaticMarkup(<VaultMarkdown body={body} onNavigate={() => {}} />)
}

describe('VaultMarkdown — callouts', () => {
    it('renders a per-type class + icon and strips the marker, body preserved', () => {
        const html = render('> [!warning] Cuidado\n> Texto de aviso.')
        expect(html).toContain('callout-warning')
        expect(html).toContain('callout-icon')
        expect(html).toContain('<svg')
        expect(html).toContain('Cuidado')
        expect(html).toContain('Texto de aviso.')
        expect(html).not.toContain('[!warning]')
    })

    it('uses distinct classes per type', () => {
        expect(render('> [!danger] x')).toContain('callout-danger')
        expect(render('> [!info] x')).toContain('callout-info')
        expect(render('> [!tip] x')).toContain('callout-tip')
        expect(render('> [!success] x')).toContain('callout-success')
    })

    it('shows the type label when no title is given', () => {
        const html = render('> [!danger]\n> boom')
        expect(html).toContain('Danger')
        expect(html).toContain('callout-icon')
        expect(html).toContain('<svg')
    })

    it('leaves a normal blockquote alone', () => {
        const html = render('> just a quote')
        expect(html).toContain('<blockquote>')
        expect(html).not.toContain('callout')
    })
})

describe('VaultMarkdown — GFM tables', () => {
    it('renders pipe tables as <table>', () => {
        const html = render('| A | B |\n| - | - |\n| 1 | 2 |')
        expect(html).toContain('<table')
        expect(html).toContain('<td')
        expect(html).toContain('>1</td>')
    })
})

describe('VaultMarkdown — image embeds reach VaultImage', () => {
    it('routes ![[img]] (already resolved) through VaultImage, not a plain <img>', () => {
        // Feed the ALREADY-preprocessed markdown (bypassing the store) to confirm the
        // react-markdown -> urlTransform -> img component -> VaultImage path works with
        // an angle-bracket vault-img url that contains spaces.
        const html = renderToStaticMarkup(
            <VaultMarkdown body={'![Escudo](<vault-img:imagenes/Escudo Real.png>)'} onNavigate={() => {}} />,
        )
        // VaultImage shows this placeholder before the (never-run) async IPC resolves.
        expect(html).toContain('cargando imagen')
        expect(html).not.toContain('<img')
        expect(html).not.toContain('![Escudo]')
    })
})

describe('react-markdown angle-bracket links (the spaces fix)', () => {
    it('parses [text](<url with spaces>) as a real anchor', () => {
        const html = renderToStaticMarkup(
            <ReactMarkdown>{'[Casa Dragoon](<vault-note:Mundo/Casa Dragoon/Casa Dragoon.md>)'}</ReactMarkdown>,
        )
        expect(html).toContain('<a')
        expect(html).toContain('Casa Dragoon')
        // Crucially, it is NOT rendered as literal text
        expect(html).not.toContain('](&lt;vault-note')
        expect(html).not.toContain('](<vault-note')
    })
})
