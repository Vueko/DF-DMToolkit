import { useEffect, useState } from 'react'
import { useT } from '../../i18n'

// Word (.docx): mammoth (docx → HTML legible) + DOMPurify (saneado) — ambos cargados
// dinámicamente, así que no tocan el bundle de arranque.
function DocxViewer({ path }: { path: string }) {
    const t = useT()
    const [html, setHtml] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const bytes = await window.electron.vault.readBinary(path)
            if (cancelled) return
            if (!bytes) { setFailed(true); return }
            try {
                const mammoth = await import('mammoth')
                const DOMPurify = (await import('dompurify')).default
                const arrayBuffer = new Uint8Array(bytes).buffer
                const result = await mammoth.convertToHtml({ arrayBuffer })
                if (cancelled) return
                setHtml(DOMPurify.sanitize(result.value))
            } catch {
                if (!cancelled) setFailed(true)
            }
        })()
        return () => { cancelled = true }
    }, [path])

    if (failed) return <p className="text-ui-muted text-sm italic">{t('wiki.readError')}</p>
    if (html === null) return <p className="text-ui-muted text-sm">{t('wiki.loadingVault')}</p>

    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
}

export default DocxViewer
