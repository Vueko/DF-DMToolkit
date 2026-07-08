import type { VaultNode } from '../types'

export interface NoteRef {
    name: string
    path: string
}

export function parseWikiTarget(inner: string): { name: string; heading: string | null; alias: string | null } {
    let rest = inner.trim()
    let alias: string | null = null
    const pipe = rest.indexOf('|')
    if (pipe !== -1) {
        alias = rest.slice(pipe + 1).trim() || null
        rest = rest.slice(0, pipe)
    }
    let heading: string | null = null
    const hash = rest.indexOf('#')
    if (hash !== -1) {
        heading = rest.slice(hash + 1).trim() || null
        rest = rest.slice(0, hash)
    }
    return { name: rest.trim(), heading, alias }
}

function walk(node: VaultNode | null, visit: (n: VaultNode) => void): void {
    if (!node) return
    if (node.type !== 'folder') visit(node)
    node.children?.forEach((c) => walk(c, visit))
}

function basename(fileName: string): string {
    const dot = fileName.lastIndexOf('.')
    return dot === -1 ? fileName : fileName.slice(0, dot)
}

export function listNotes(tree: VaultNode | null): NoteRef[] {
    const out: NoteRef[] = []
    walk(tree, (n) => {
        if (n.type === 'note') out.push({ name: basename(n.name), path: n.path })
    })
    return out
}

export function buildNoteIndex(tree: VaultNode | null): Map<string, string> {
    const index = new Map<string, string>()
    for (const note of listNotes(tree)) {
        const key = note.name.toLowerCase()
        if (!index.has(key)) index.set(key, note.path)
    }
    return index
}

export function buildImageIndex(tree: VaultNode | null): Map<string, string> {
    const index = new Map<string, string>()
    walk(tree, (n) => {
        if (n.type === 'image') {
            const key = n.name.toLowerCase()
            if (!index.has(key)) index.set(key, n.path)
        }
    })
    return index
}

export function resolveNote(index: Map<string, string>, name: string): string | null {
    return index.get(name.trim().toLowerCase()) ?? null
}
