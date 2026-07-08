import { useUpdateStore } from '../store/updateStore'
import { Button } from './ui'
import { useT } from '../i18n'

export function UpdateNotification() {
    const t = useT()
    const status = useUpdateStore((s) => s.status)
    const version = useUpdateStore((s) => s.version)
    const percent = useUpdateStore((s) => s.percent)
    const dismissed = useUpdateStore((s) => s.dismissed)
    const dismiss = useUpdateStore((s) => s.dismiss)

    if (dismissed) return null
    if (status !== 'available' && status !== 'downloading' && status !== 'downloaded') return null

    return (
        <div className="modal-enter fixed bottom-4 right-4 z-50 w-72 bg-ui-surface border border-ui-surface2 rounded-xl shadow-2xl p-4 flex flex-col gap-2">
            {status === 'available' && (
                <>
                    <p className="text-ui-text text-sm font-medium">{t('update.newVersionAvailable', { version: version ?? '' })}</p>
                    <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => window.electron.updater.download()}>{t('update.download')}</Button>
                        <Button variant="secondary" size="sm" onClick={dismiss}>{t('update.notNow')}</Button>
                    </div>
                </>
            )}
            {status === 'downloading' && (
                <>
                    <p className="text-ui-text text-sm font-medium">{t('update.downloading', { percent })}</p>
                    <div className="h-1.5 bg-ui-surface2 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all" style={{ width: `${percent}%` }} />
                    </div>
                </>
            )}
            {status === 'downloaded' && (
                <>
                    <p className="text-ui-text text-sm font-medium">{t('update.ready', { version: version ?? '' })}</p>
                    <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => window.electron.updater.install()}>{t('update.restartNow')}</Button>
                        <Button variant="secondary" size="sm" onClick={dismiss}>{t('update.onClose')}</Button>
                    </div>
                </>
            )}
        </div>
    )
}
