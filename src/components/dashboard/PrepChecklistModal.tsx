import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Campaign } from '../../types'
import { useSettingsStore } from '../../store/settingsStore'
import { buildPrepSteps } from './prepSteps'
import { useT } from '../../i18n'

interface PrepChecklistModalProps {
    campaign: Campaign | null
    open: boolean
    onClose: () => void
}

function PrepChecklistModal({ campaign, open, onClose }: PrepChecklistModalProps) {
    const t = useT()
    const vaultPath = useSettingsStore((s) => s.vaultPath)

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    if (!open) return null

    const steps = buildPrepSteps(campaign, vaultPath)
    const allDone = steps.every((s) => s.done)

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="modal-enter bg-ui-surface w-full max-w-lg rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-ui-surface2">
                    <div>
                        <h2 className="text-ui-text font-display font-semibold text-lg">{t('prep.title')}</h2>
                        <p className="text-ui-muted text-xs">{campaign ? campaign.name : t('prep.firstSteps')}</p>
                    </div>
                    <button onClick={onClose} className="text-ui-muted hover:text-ui-text transition-colors text-xl font-bold" aria-label={t('prep.close')}>✕</button>
                </div>

                <div className="p-4 flex flex-col gap-2">
                    {steps.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 bg-ui-bg/40 rounded-lg px-4 py-3">
                            <span className={`text-sm shrink-0 ${item.done ? 'text-green-600' : 'text-ui-muted'}`}>
                                {item.done ? '✓' : '○'}
                            </span>
                            <span className={`text-sm flex-1 ${item.done ? 'text-ui-muted line-through' : 'text-ui-text font-medium'}`}>
                                {t(item.label)}
                            </span>
                            {!item.done && item.link && item.linkLabel && (
                                <Link to={item.link} onClick={onClose} className="text-arcane-light hover:text-arcane-secondary text-xs transition-colors shrink-0">
                                    {t(item.linkLabel)} →
                                </Link>
                            )}
                        </div>
                    ))}
                    <Link
                        to="/campaigns"
                        onClick={onClose}
                        className={`flex items-center justify-center mt-1 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                            allDone
                                ? 'bg-danger-yellow text-ui-canvas hover:bg-danger-secondary'
                                : 'bg-ui-surface2 text-ui-muted hover:bg-ui-surface hover:text-ui-text'
                        }`}
                    >
                        {allDone ? t('prep.allReadyActivate') : t('prep.activateSession')}
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PrepChecklistModal
