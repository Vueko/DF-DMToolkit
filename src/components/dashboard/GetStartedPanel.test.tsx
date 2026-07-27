import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { GetStartedContent } from './GetStartedPanel'
import { buildStartSteps } from './startSteps'
import type { Campaign } from '../../types'

// El idioma por defecto del settingsStore es 'en'; el SSR usa el snapshot inicial.
const render = (built: ReturnType<typeof buildStartSteps>) =>
    renderToStaticMarkup(<MemoryRouter><GetStartedContent steps={built.steps} optional={built.optional} /></MemoryRouter>)

const campaign: Campaign = { id: 'c1', name: 'C', scenes: [], sessions: [], playlists: [] }

describe('GetStartedContent', () => {
    it('sin datos: título y primer paso destacado con un único CTA', () => {
        const html = render(buildStartSteps(null, [], null, null))
        expect(html).toContain('Get started')
        expect(html).toContain('Create a campaign')
        expect(html.match(/>Go</g) ?? []).toHaveLength(1)
    })
    it('con campaña: el CTA pasa al paso de sesión y el 1 queda tachado', () => {
        const html = render(buildStartSteps(campaign, [], null, null))
        expect(html).toContain('line-through')
        expect(html.match(/>Go</g) ?? []).toHaveLength(1)
        expect(html.indexOf('Create a session')).toBeGreaterThan(-1)
        expect(html.indexOf('>Go<')).toBeGreaterThan(html.indexOf('Create a session'))
    })
    it('muestra la fila opcional del vault', () => {
        expect(render(buildStartSteps(null, [], null, null))).toContain('Optional: connect a notes vault')
    })
})
