import { Button } from './ui'
import { buildFullExport, parseImport, mergeCampaignBlobs, FULL_STORE_KEYS } from '../utils/backup'
import { useT } from '../i18n'

export function BackupControls() {
    const t = useT()
    const handleExport = async () => {
        const blobs: Record<string, string | null> = {}
        await Promise.all(FULL_STORE_KEYS.map(async (key) => {
            const value = await window.electron.store.get(key)
            blobs[key] = typeof value === 'string' ? value : null
        }))
        const envelope = buildFullExport(blobs)
        await window.electron.dialog.saveJson(JSON.stringify(envelope, null, 2), {
            defaultPath: `dnd5e-backup-${new Date().toISOString().split('T')[0]}.json`,
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        })
    }

    const handleImport = async () => {
        const result = await window.electron.dialog.openJson({
            filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        })
        if (result.canceled) return
        if (!result.content) { alert(t('backup.readError')); return }
        const parsed = parseImport(result.content)
        if (parsed.kind !== 'full') {
            alert(parsed.kind === 'invalid' ? parsed.reason : t('backup.notFullBackup'))
            return
        }
        for (const key of FULL_STORE_KEYS) {
            const incoming = parsed.data[key]
            if (typeof incoming !== 'string') continue
            if (key === 'dnd-campaigns') {
                const current = await window.electron.store.get('dnd-campaigns')
                const currentBlob = typeof current === 'string' ? current : null
                window.electron.store.set(key, mergeCampaignBlobs(currentBlob, incoming))
            } else {
                window.electron.store.set(key, incoming)
            }
        }
        alert(t('backup.importSuccess'))
        window.location.reload()
    }

    return (
        <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleImport} title={t('backup.importTitle')}>{t('backup.import')}</Button>
            <Button variant="secondary" onClick={handleExport} title={t('backup.exportTitle')}>{t('backup.export')}</Button>
        </div>
    )
}
