import type { SessionItem, SessionItemKind } from '../../types'

export interface GroupedSessionItems {
    clues: SessionItem[]
    loot: SessionItem[]
    messages: SessionItem[]
    notes: SessionItem[]
}

export function groupSessionItems(items: SessionItem[] | undefined): GroupedSessionItems {
    const grouped: GroupedSessionItems = { clues: [], loot: [], messages: [], notes: [] }
    const bucket: Record<SessionItemKind, SessionItem[]> = {
        clue: grouped.clues,
        loot: grouped.loot,
        message: grouped.messages,
        note: grouped.notes,
    }
    for (const item of items ?? []) bucket[item.kind].push(item)
    return grouped
}
