import { useCallback, useEffect, useState } from 'react'
import type { SrdResource } from '../types'
import { srdFetch } from './srdClient'
import { useSettingsStore } from '../store/settingsStore'

interface SrdState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

// Estados de carga sobre srdFetch (caché en memoria + dedupe en srdClient).
export function useSrd<T = unknown>(resource: SrdResource, key?: string) {
    const version = useSettingsStore((s) => s.srdVersion)
    const [state, setState] = useState<SrdState<T>>({ data: null, loading: true, error: null })
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        let mounted = true
        // Intentional sync: al cambiar de recurso/reintentar volvemos a estado de carga
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((s) => (s.loading && s.error === null ? s : { ...s, loading: true, error: null }))
        srdFetch<T>(resource, key, version).then((res) => {
            if (!mounted) return
            if (res.ok) setState({ data: res.data, loading: false, error: null })
            else setState((s) => ({ ...s, loading: false, error: res.error }))
        })
        return () => { mounted = false }
    }, [resource, key, version, attempt])

    const retry = useCallback(() => setAttempt((n) => n + 1), [])
    return { ...state, retry }
}
