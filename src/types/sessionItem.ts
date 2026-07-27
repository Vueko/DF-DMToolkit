export type SessionItemKind = 'clue' | 'loot' | 'message' | 'note'

export interface SessionItem {
    id: string
    kind: SessionItemKind
    title: string
    body?: string        // markdown de detalle; para 'note' es el contenido principal
    done: boolean        // clue=revelada, loot=entregado, message=entregado; ignorado para 'note'
}
