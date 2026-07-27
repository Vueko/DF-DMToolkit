import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { RequirementNotice } from './RequirementNotice'

const render = (el: React.ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>)

describe('RequirementNotice', () => {
    it('muestra título, hint y CTA con su ruta', () => {
        const html = render(<RequirementNotice title="Falta campaña" hint="Creá una" link="/campaigns" linkLabel="Campañas" />)
        expect(html).toContain('Falta campaña')
        expect(html).toContain('Creá una')
        expect(html).toContain('href="/campaigns"')
        expect(html).toContain('Campañas →')
    })
    it('sin hint no renderiza el párrafo', () => {
        const html = render(<RequirementNotice title="T" link="/x" linkLabel="X" />)
        expect(html).not.toContain('text-ui-muted text-sm')
    })
})
