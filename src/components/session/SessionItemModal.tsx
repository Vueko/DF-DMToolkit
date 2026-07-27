import { useState } from 'react'
import type { SessionItem, SessionItemKind } from '../../types'
import { Button, Input, Textarea } from '../ui'
import { SharedMarkdown } from '../SharedMarkdown'
import { KIND_CONFIG } from './SessionItemRow'
import { useT } from '../../i18n'

const KINDS: SessionItemKind[] = ['clue', 'loot', 'message', 'note']

function SessionItemModal({ initial, isCreate, onSave, onDelete, onClose }: {
    initial: SessionItem
    isCreate: boolean
    onSave: (item: SessionItem) => void
    onDelete?: () => void
    onClose: () => void
}) {
    const t = useT()
    const [draft, setDraft] = useState<SessionItem>(initial)
    const [bodyMode, setBodyMode] = useState<'write' | 'preview'>(initial.body ? 'preview' : 'write')
    const set = (u: Partial<SessionItem>) => setDraft((d) => ({ ...d, ...u }))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
            <div className="bg-ui-surface w-full max-w-xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                    <h2 className="text-xl font-display font-semibold text-ui-text">
                        {t(isCreate ? 'sessionItem.createTitle' : 'sessionItem.editTitle')}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('sessionItem.kindLabel')}</label>
                        <div className="flex gap-1.5">
                            {KINDS.map((k) => {
                                const cfg = KIND_CONFIG[k]
                                const active = draft.kind === k
                                return (
                                    <button
                                        key={k}
                                        onClick={() => set({ kind: k })}
                                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                            active ? `${cfg.bg} ${cfg.border} ${cfg.text}` : 'bg-ui-surface2 border-ui-surface2 text-ui-muted hover:text-ui-text'
                                        }`}
                                    >
                                        <span>{cfg.icon}</span>
                                        <span>{t(cfg.kindKey)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('sessionItem.titleLabel')}</label>
                        <Input theme="danger" type="text" value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder={t('sessionItem.titlePlaceholder')} />
                    </div>

                    <div className="flex flex-col gap-2 flex-1 min-h-[160px]">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('sessionItem.bodyLabel')}</label>
                            <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                <button onClick={() => setBodyMode('write')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${bodyMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>{t('scenes.write')}</button>
                                <button onClick={() => setBodyMode('preview')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${bodyMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}>{t('scenes.preview')}</button>
                            </div>
                        </div>
                        {bodyMode === 'write' ? (
                            <Textarea theme="danger" value={draft.body ?? ''} onChange={(e) => set({ body: e.target.value })} className="flex-1 font-mono" placeholder={t('sessionItem.bodyPlaceholder')} />
                        ) : (
                            <div className="w-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto min-h-[140px] prose max-w-none text-ui-text">
                                {draft.body ? <SharedMarkdown>{draft.body}</SharedMarkdown> : <p className="italic opacity-50 text-sm">{t('scenes.nothingWritten')}</p>}
                            </div>
                        )}
                    </div>

                    {draft.kind !== 'note' && (
                        <label className="flex items-center gap-2 text-sm text-ui-text cursor-pointer">
                            <input type="checkbox" checked={draft.done} onChange={(e) => set({ done: e.target.checked })} />
                            {t('sessionItem.doneLabel')}
                        </label>
                    )}
                </div>

                <div className="p-6 border-t border-ui-surface2 flex justify-between bg-ui-surface/50 rounded-b-2xl">
                    {onDelete ? <Button variant="destructive" onClick={onDelete}>{t('sessionItem.delete')}</Button> : <div />}
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>{t(isCreate ? 'scenes.cancel' : 'scenes.close')}</Button>
                        <button
                            onClick={() => onSave(draft)}
                            disabled={!draft.title.trim()}
                            className="px-6 py-2 text-sm bg-danger-primary hover:bg-danger-gold text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('sessionItem.save')}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default SessionItemModal
