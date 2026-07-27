export type VaultViewer = 'markdown' | 'image' | 'pdf' | 'doc'

const IMAGE = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp'])

// Elige el visor del World Wiki por extensión. Sin extensión reconocida → markdown
// (las notas .md son el caso por defecto; el resto son documentos hoja de solo lectura).
export function viewerForPath(p: string): VaultViewer {
    const lower = p.toLowerCase()
    const ext = lower.includes('.') ? lower.split('.').pop() ?? '' : ''
    if (IMAGE.has(ext)) return 'image'
    if (ext === 'pdf') return 'pdf'
    if (ext === 'docx') return 'doc'
    return 'markdown'
}
