import { useEffect, useState } from 'react'
import type { SrdVersion } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { Select } from './ui'
import { useT } from '../i18n'

// Selector de versión del SRD + enlace al PDF oficial. La lista de versiones la sirve main (fuente única).
export function SrdVersionPicker() {
    const t = useT()
    const srdVersion = useSettingsStore((s) => s.srdVersion)
    const setSrdVersion = useSettingsStore((s) => s.setSrdVersion)
    const [versions, setVersions] = useState<SrdVersion[]>([])

    useEffect(() => { window.electron.srd.versions().then(setVersions) }, [])

    const current = versions.find((v) => v.id === srdVersion)
    if (versions.length === 0) return null

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <label className="text-ui-muted text-xs uppercase tracking-wider font-bold">{t('settings.srdVersion')}</label>
            <Select value={srdVersion} onChange={(e) => setSrdVersion(e.target.value)} className="w-auto">
                {versions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </Select>
            {current && (
                <a href={current.pdfUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline text-sm">
                    {t('settings.srdOfficialPdf')} ↗
                </a>
            )}
        </div>
    )
}
