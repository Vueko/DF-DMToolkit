import { useCallback, useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useT } from '../../i18n'

// PDF: pdfjs-dist cargado dinámicamente (no toca el arranque). El worker se empaqueta
// localmente vía ?url para cumplir la CSP (script-src 'self'); nunca desde una CDN.
// Búsqueda por página: al primer buscar se extrae el texto de cada página (perezoso) y
// se salta a las páginas con coincidencias.
function PdfViewer({ path }: { path: string }) {
    const t = useT()
    const pagesRef = useRef<HTMLDivElement>(null)
    const pageEls = useRef<HTMLDivElement[]>([])
    const docRef = useRef<PDFDocumentProxy | null>(null)
    const textsRef = useRef<string[] | null>(null)

    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
    const [numPages, setNumPages] = useState(0)
    const [query, setQuery] = useState('')
    const [matches, setMatches] = useState<number[]>([])
    const [matchIdx, setMatchIdx] = useState(0)
    const [searched, setSearched] = useState(false)

    const scrollToPage = useCallback((page: number) => {
        pageEls.current[page - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    useEffect(() => {
        let cancelled = false
        const pagesContainer = pagesRef.current
        ;(async () => {
            const bytes = await window.electron.vault.readBinary(path)
            if (cancelled || !pagesContainer) return
            if (!bytes) { setStatus('error'); return }
            try {
                const pdfjs = await import('pdfjs-dist')
                pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
                const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise
                if (cancelled) return
                docRef.current = doc
                setNumPages(doc.numPages)
                for (let n = 1; n <= doc.numPages; n++) {
                    const page = await doc.getPage(n)
                    if (cancelled) return
                    const viewport = page.getViewport({ scale: 1.3 })
                    const wrapper = document.createElement('div')
                    const canvas = document.createElement('canvas')
                    canvas.width = viewport.width
                    canvas.height = viewport.height
                    canvas.className = 'mx-auto mb-4 rounded shadow max-w-full h-auto'
                    wrapper.appendChild(canvas)
                    pagesContainer.appendChild(wrapper)
                    pageEls.current[n - 1] = wrapper
                    await page.render({ canvas, viewport }).promise
                }
                if (!cancelled) setStatus('ready')
            } catch {
                if (!cancelled) setStatus('error')
            }
        })()
        return () => { cancelled = true; docRef.current = null }
    }, [path])

    const runSearch = useCallback(async () => {
        const needle = query.trim().toLowerCase()
        setSearched(true)
        const doc = docRef.current
        if (!needle || !doc) { setMatches([]); setMatchIdx(0); return }
        // Índice de texto perezoso: se construye una sola vez, al primer buscar.
        if (!textsRef.current) {
            const texts: string[] = []
            for (let n = 1; n <= doc.numPages; n++) {
                const tc = await doc.getPage(n).then((p) => p.getTextContent())
                texts[n - 1] = tc.items.map((it) => ('str' in it ? it.str : '')).join(' ').toLowerCase()
            }
            textsRef.current = texts
        }
        const found: number[] = []
        textsRef.current.forEach((txt, i) => { if (txt.includes(needle)) found.push(i + 1) })
        setMatches(found)
        setMatchIdx(0)
        if (found.length) scrollToPage(found[0])
    }, [query, scrollToPage])

    const goMatch = (delta: number) => {
        if (!matches.length) return
        const next = (matchIdx + delta + matches.length) % matches.length
        setMatchIdx(next)
        scrollToPage(matches[next])
    }

    return (
        <div className="flex flex-col">
            <div className="sticky top-0 z-10 py-2 mb-3 bg-ui-surface/95 backdrop-blur border-b border-ui-surface2 flex items-center gap-2 flex-wrap not-prose">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                    placeholder={t('wiki.pdfSearch')}
                    className="flex-1 min-w-[160px] bg-ui-surface2 border border-ui-surface2 text-ui-text text-sm px-3 py-1.5 rounded-lg outline-none focus:border-danger-gold/50 placeholder:text-ui-muted"
                />
                <button onClick={runSearch} className="text-sm px-3 py-1.5 rounded-lg bg-danger-primary text-white hover:bg-danger-gold transition-colors">
                    {t('wiki.pdfSearchGo')}
                </button>
                {matches.length > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-ui-muted">
                        <button onClick={() => goMatch(-1)} title={t('wiki.pdfPrev')} className="px-2 py-1 rounded hover:bg-ui-surface2">&#x2191;</button>
                        <span className="tabular-nums">{matchIdx + 1}/{matches.length} · {t('wiki.pdfPage')} {matches[matchIdx]}</span>
                        <button onClick={() => goMatch(1)} title={t('wiki.pdfNext')} className="px-2 py-1 rounded hover:bg-ui-surface2">&#x2193;</button>
                    </div>
                ) : searched && query.trim() ? (
                    <span className="text-xs text-ui-muted">{t('wiki.pdfNoMatches')}</span>
                ) : null}
                {numPages > 0 && <span className="ml-auto text-xs text-ui-muted">{t('wiki.pdfPages', { count: numPages })}</span>}
            </div>

            {status === 'loading' && <p className="text-ui-muted text-sm">{t('wiki.loadingVault')}</p>}
            {status === 'error' && <p className="text-ui-muted text-sm italic">{t('wiki.readError')}</p>}
            <div ref={pagesRef} className="flex flex-col items-center" />
        </div>
    )
}

export default PdfViewer
