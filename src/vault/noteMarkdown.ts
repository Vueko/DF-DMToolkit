import { parse as parseYaml } from 'yaml'
import { parseWikiTarget, resolveNote } from './wikilinks'

export function extractFrontmatter(md: string): { frontmatter: Record<string, unknown> | null; body: string } {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md)
    if (!match) return { frontmatter: null, body: md }
    let frontmatter: Record<string, unknown> | null = null
    try {
        const parsed = parseYaml(match[1])
        frontmatter = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
    } catch {
        frontmatter = null
    }
    return { frontmatter, body: md.slice(match[0].length) }
}

// Wrap a URL in <...> so destinations with spaces/parens stay a single token in
// markdown (e.g. "Casa Dragoon/Casa Dragoon.md"). CommonMark angle-bracket
// destinations allow spaces; only literal <, > or newlines are disallowed.
function angleUrl(url: string): string {
    return `<${url.replace(/[<>]/g, '')}>`
}

function replaceEmbeds(text: string, imageIndex: Map<string, string>): string {
    return text.replace(/!\[\[([^\]]+)\]\]/g, (whole, inner: string) => {
        // Strip the size/alias suffix: ![[img.png|200]] -> "img.png"
        const name = inner.split('|')[0].trim()
        // Resolve by exact name, then fall back to basename (for ![[folder/img.png]]).
        let target = imageIndex.get(name.toLowerCase())
        if (!target && name.includes('/')) {
            const base = name.slice(name.lastIndexOf('/') + 1)
            target = imageIndex.get(base.toLowerCase())
        }
        const display = name.slice(name.lastIndexOf('/') + 1)
        return target ? `![${display}](${angleUrl(`vault-img:${target}`)})` : whole
    })
}

function replaceLinks(text: string, noteIndex: Map<string, string>): string {
    return text.replace(/\[\[([^\]]+)\]\]/g, (whole, inner: string) => {
        const { name, heading, alias } = parseWikiTarget(inner)
        const target = resolveNote(noteIndex, name)
        if (!target) return whole
        const display = alias || name
        const url = heading ? `vault-note:${target}#${heading}` : `vault-note:${target}`
        return `[${display}](${angleUrl(url)})`
    })
}

export function preprocessNoteMarkdown(
    body: string,
    noteIndex: Map<string, string>,
    imageIndex: Map<string, string>,
): string {
    // Procesa por segmentos, saltando bloques de código cercados (```) e inline (`...`).
    const parts = body.split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    return parts
        .map((part) => {
            if (part.startsWith('```')) return part
            if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) return part
            return replaceLinks(replaceEmbeds(part, imageIndex), noteIndex)
        })
        .join('')
}
