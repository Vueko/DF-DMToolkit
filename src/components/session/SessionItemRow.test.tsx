import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SessionItemRow from './SessionItemRow'
import type { SessionItem } from '../../types/sessionItem'

vi.mock('../SharedMarkdown', () => ({
    SharedMarkdown: ({ children }: { children: string }) => children,
}))

const base: SessionItem = { id: 'i1', kind: 'clue', title: 'Altar carving', done: false }
const noop = () => {}

describe('SessionItemRow', () => {
    it('pista pendiente muestra el título sin tachar', () => {
        const html = renderToStaticMarkup(
            <SessionItemRow item={base} onToggle={noop} onEdit={noop} onRemove={noop} />,
        )
        expect(html).toContain('Altar carving')
        expect(html).not.toContain('line-through')
    })
    it('pista revelada se atenúa y tacha', () => {
        const html = renderToStaticMarkup(
            <SessionItemRow item={{ ...base, done: true }} onToggle={noop} onEdit={noop} onRemove={noop} />,
        )
        expect(html).toContain('opacity-50')
        expect(html).toContain('line-through')
    })
    it('la nota rinde su título y no tiene toggle', () => {
        const html = renderToStaticMarkup(
            <SessionItemRow item={{ id: 'n', kind: 'note', title: 'Lore', body: 'Vol cult', done: false }} onToggle={noop} onEdit={noop} onRemove={noop} />,
        )
        expect(html).toContain('Lore')
        expect(html).not.toContain('rounded-full')
    })
})
