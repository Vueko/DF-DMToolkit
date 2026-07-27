import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SessionItemSections from './SessionItemSections'
import { groupSessionItems } from './groupSessionItems'
import type { SessionItem } from '../../types'

const noop = () => {}
const items: SessionItem[] = [{ id: 'a', kind: 'clue', title: 'Carving', done: false }]

describe('SessionItemSections', () => {
    it('showEmpty=false oculta las secciones vacías', () => {
        const html = renderToStaticMarkup(
            <SessionItemSections grouped={groupSessionItems(items)} showEmpty={false} showAdd={false} onToggle={noop} onEdit={noop} onRemove={noop} onAdd={noop} />,
        )
        expect(html).toContain('Clues')
        expect(html).toContain('Carving')
        expect(html).not.toContain('Loot')
    })
    it('showEmpty=true rinde las cuatro secciones', () => {
        const html = renderToStaticMarkup(
            <SessionItemSections grouped={groupSessionItems([])} showEmpty showAdd onToggle={noop} onEdit={noop} onRemove={noop} onAdd={noop} />,
        )
        expect(html).toContain('Clues')
        expect(html).toContain('Loot')
        expect(html).toContain('Messages')
        expect(html).toContain('Notes')
    })
})
