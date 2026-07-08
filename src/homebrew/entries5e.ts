import { strip5eTags } from './tags5e'

interface Entry {
    type?: string
    name?: string
    entries?: unknown[]
    items?: unknown[]
    caption?: string
    colLabels?: string[]
    rows?: unknown[][]
}

function cellText(cell: unknown): string {
    if (typeof cell === 'string') return strip5eTags(cell)
    if (cell && typeof cell === 'object') {
        const c = cell as { roll?: { exact?: number; min?: number; max?: number }; entry?: string }
        if (typeof c.entry === 'string') return strip5eTags(c.entry)
        if (c.roll?.exact !== undefined) return String(c.roll.exact)
        if (c.roll?.min !== undefined) return `${c.roll.min}–${c.roll.max ?? ''}`
    }
    return ''
}

function block(node: unknown): string {
    if (typeof node === 'string') return strip5eTags(node)
    if (!node || typeof node !== 'object') return ''
    const e = node as Entry
    switch (e.type) {
        case undefined:
        case 'entries':
        case 'inset':
        case 'insetReadaloud': {
            const inner = flattenEntries(e.entries ?? [])
            return e.name ? `**${strip5eTags(e.name)}.** ${inner}` : inner
        }
        case 'list':
            return (e.items ?? []).map((it) =>
                typeof it === 'string' ? `- ${strip5eTags(it)}` : `- ${block(it)}`).join('\n')
        case 'table': {
            const cols = e.colLabels?.map((c) => strip5eTags(c)) ?? []
            const header = `| ${cols.join(' | ')} |`
            const sep = `| ${cols.map(() => '---').join(' | ')} |`
            const rows = (e.rows ?? []).map((r) => `| ${r.map(cellText).join(' | ')} |`)
            return [e.caption ? `**${strip5eTags(e.caption)}**` : '', header, sep, ...rows].filter(Boolean).join('\n')
        }
        default:
            return ''
    }
}

// Aplana el árbol de `entries` de 5etools a markdown.
export function flattenEntries(entries: unknown[]): string {
    return (entries ?? []).map(block).filter((s) => s !== '').join('\n\n')
}
