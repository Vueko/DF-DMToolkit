import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SessionItemModal from './SessionItemModal'
import type { SessionItem } from '../../types'

const initial: SessionItem = { id: 'i1', kind: 'clue', title: 'A clue', done: false }
const noop = () => {}

describe('SessionItemModal', () => {
    it('modo edición muestra el título del ítem y el botón borrar', () => {
        const html = renderToStaticMarkup(
            <SessionItemModal initial={initial} isCreate={false} onSave={noop} onDelete={noop} onClose={noop} />,
        )
        expect(html).toContain('value="A clue"')
        expect(html).toContain('Delete')
    })
    it('sin onDelete no muestra el botón borrar', () => {
        const html = renderToStaticMarkup(
            <SessionItemModal initial={{ ...initial, title: '' }} isCreate onSave={noop} onClose={noop} />,
        )
        expect(html).not.toContain('>Delete<')
    })
    it('el checkbox done no aparece para notas', () => {
        const html = renderToStaticMarkup(
            <SessionItemModal initial={{ id: 'n', kind: 'note', title: 'x', done: false }} isCreate onSave={noop} onClose={noop} />,
        )
        expect(html).not.toContain('Already used this session')
    })
})
