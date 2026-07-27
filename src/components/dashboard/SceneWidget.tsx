import { useMemo, useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { Scene, SceneFlagType, SessionItem, SessionItemKind } from '../../types'
import { groupSessionItems } from '../session/groupSessionItems'
import SessionItemSections from '../session/SessionItemSections'
import SessionItemModal from '../session/SessionItemModal'
import { KIND_CONFIG } from '../session/SessionItemRow'
import { useLaunchEncounter } from '../../hooks/useLaunchEncounter'
import { useT } from '../../i18n'

const FLAG_CONFIG: Record<SceneFlagType, { icon: string; bg: string; border: string; text: string }> = {
    event: { icon: '', bg: 'bg-danger-primary/10', border: 'border-danger-primary/25', text: 'text-danger-primary' },
    time: { icon: '', bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-700' },
    decision: { icon: '', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-700' },
}

const STATUS_BADGE: Record<Scene['status'], string> = {
    upcoming: 'bg-ui-surface2 text-ui-muted border border-ui-surface2',
    active: 'bg-danger-primary text-white',
    completed: 'bg-arcane-light/20 text-arcane-light border border-arcane-light/30',
}

const STATUS_LABEL_KEY: Record<Scene['status'], string> = {
    upcoming: 'dashboard.statusNext',
    active: 'dashboard.statusActive',
    completed: 'dashboard.statusDone',
}

const nextStatus: Record<Scene['status'], Scene['status']> = {
    upcoming: 'active',
    active: 'completed',
    completed: 'upcoming',
}

function SceneWidget() {
    const t = useT()
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        updateScene,
        addSceneToSession,
        removeSceneFromSession,
        addSessionItem,
        updateSessionItem,
        removeSessionItem,
    } = useCampaignStore()
    const launchEncounter = useLaunchEncounter()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const sessionScenes = useMemo(
        () => currentCampaign?.scenes.filter((s) => currentSession?.sceneIds.includes(s.id)) ?? [],
        [currentCampaign?.scenes, currentSession?.sceneIds]
    )

    const unlinkedScenes = useMemo(
        () => currentCampaign?.scenes.filter((s) => !currentSession?.sceneIds.includes(s.id)) ?? [],
        [currentCampaign?.scenes, currentSession?.sceneIds]
    )

    const grouped = useMemo(() => groupSessionItems(currentSession?.items), [currentSession?.items])
    const [editingItem, setEditingItem] = useState<{ item: SessionItem; isCreate: boolean } | null>(null)

    if (!currentCampaignId || !currentSessionId) {
        return (
            <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.sceneTracker')}</h3>
                <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noActiveSessionGoCampaigns')}</p>
            </div>
        )
    }

    const openCreateItem = (kind: SessionItemKind) =>
        setEditingItem({ item: { id: crypto.randomUUID(), kind, title: '', done: false }, isCreate: true })

    const saveItem = (draft: SessionItem) => {
        if (!currentCampaignId || !currentSessionId) return
        if (editingItem?.isCreate) addSessionItem(currentCampaignId, currentSessionId, draft)
        else updateSessionItem(currentCampaignId, currentSessionId, draft.id, draft)
        setEditingItem(null)
    }

    function renderFlag(scene: Scene) {
        if (!scene.flag) return null
        const flagType = scene.flagType ?? 'event'
        const cfg = FLAG_CONFIG[flagType]

        return (
            <div className={`flex flex-col gap-1.5 ${cfg.bg} ${cfg.border} border rounded-lg px-2.5 py-2`}>
                <div className="flex items-start gap-1.5">
                    <span className={`text-[10px] font-black shrink-0 mt-0.5 ${cfg.text}`}>{cfg.icon}</span>
                    <span className={`text-xs leading-snug ${cfg.text}`}>{scene.flag}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-5 flex flex-col gap-3">

            <div className="flex items-center justify-between">
                <h3 className="text-ui-text font-display font-semibold">{t('dashboard.sceneTracker')}</h3>
                <span className="text-ui-muted text-xs">
                    {t('dashboard.scenesCount', {
                        count: sessionScenes.length,
                        active: sessionScenes.filter((s) => s.status === 'active').length,
                    })}
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {sessionScenes.length === 0 && (
                    <p className="text-ui-muted text-sm text-center py-4">{t('dashboard.noScenesInSession')}</p>
                )}

                {sessionScenes.map((scene) => {
                    const count = scene.count ?? 0
                    const max = scene.countMax ?? 0
                    const hasCountdown = max > 0
                    const pct = hasCountdown ? Math.min(100, (count / max) * 100) : 0
                    const isFull = hasCountdown && count >= max

                    return (
                        <div
                            key={scene.id}
                            className={`bg-card-bg rounded-xl border flex flex-col gap-2 p-3 transition-all ${isFull
                                ? 'border-danger-gold/60 shadow-[0_0_0_1px_rgba(var(--color-danger-gold),0.12)]'
                                : 'border-card-border'
                                }`}
                        >
                            {/* Title + status + remove */}
                            <div className="flex items-start justify-between gap-2">
                                <h4 className="text-card-text font-semibold text-sm leading-tight flex-1 min-w-0">{scene.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        onClick={() => updateScene(currentCampaignId, scene.id, { status: nextStatus[scene.status] })}
                                        className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase tracking-wide transition-colors ${STATUS_BADGE[scene.status]}`}
                                    >
                                        {t(STATUS_LABEL_KEY[scene.status])}
                                    </button>
                                    <button
                                        onClick={() => removeSceneFromSession(currentCampaignId, currentSessionId, scene.id)}
                                        className="text-card-text/30 hover:text-red-600 transition-colors text-[11px] font-bold"
                                    >✕</button>
                                </div>
                            </div>

                            {/* Typed flag */}
                            {renderFlag(scene)}

                            {/* Read-aloud + linked encounter */}
                            {scene.readAloud && (
                                <p className="border-l-2 border-danger-gold/60 pl-2 text-[11px] italic text-card-text/75 line-clamp-1">
                                    {scene.readAloud}
                                </p>
                            )}
                            {scene.encounterId && (() => {
                                const linked = (currentCampaign?.encounters ?? []).find((enc) => enc.id === scene.encounterId)
                                if (!linked) return null
                                return (
                                    <button
                                        onClick={() => launchEncounter(linked, currentCampaignId)}
                                        className="self-start text-[10px] font-bold px-2 py-0.5 rounded-lg bg-danger-primary/15 text-danger-primary hover:bg-danger-primary/25 transition-colors"
                                    >
                                        ⚔ {t('scenes.launchEncounter')}
                                    </button>
                                )
                            })()}

                            {/* Description preview */}
                            {scene.description && (
                                <p className="text-card-text/65 text-xs leading-snug line-clamp-2">
                                    {scene.description.replace(/[#*_`[\]]/g, '').trim()}
                                </p>
                            )}

                            {/* Countdown clock */}
                            {hasCountdown ? (
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-danger-gold' : 'text-card-text/50'}`}>
                                            {isFull ? `⚠ ${t('dashboard.clockFull')}` : `⏱ ${t('dashboard.clock')}`}
                                        </span>
                                        <span className={`text-xs font-bold tabular-nums ${isFull ? 'text-danger-gold' : 'text-card-text/80'}`}>
                                            {count} / {max}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-card-border/40 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-danger-gold' : 'bg-danger-primary'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => updateScene(currentCampaignId, scene.id, { count: Math.max(0, count - 1) })}
                                            disabled={count <= 0}
                                            className="w-6 h-6 bg-card-border/30 hover:bg-arcane-light/30 text-card-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                                        >−</button>
                                        <button
                                            onClick={() => updateScene(currentCampaignId, scene.id, { count: Math.min(max, count + 1) })}
                                            disabled={isFull}
                                            className="w-6 h-6 bg-card-border/30 hover:bg-danger-primary/30 text-card-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                                        >+</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold text-card-text/50 tracking-wider">{t('dashboard.count')}</span>
                                    <div className="flex items-center gap-1 ml-auto bg-card-border/20 rounded-lg px-1.5 py-0.5">
                                        <button
                                            onClick={() => updateScene(currentCampaignId, scene.id, { count: Math.max(0, count - 1) })}
                                            className="text-card-text/50 hover:text-card-text transition-colors text-xs w-4 text-center"
                                        >−</button>
                                        <span className="text-xs font-mono font-bold text-card-text w-5 text-center">{count}</span>
                                        <button
                                            onClick={() => updateScene(currentCampaignId, scene.id, { count: count + 1 })}
                                            className="text-card-text/50 hover:text-card-text transition-colors text-xs w-4 text-center"
                                        >+</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <SessionItemSections
                grouped={grouped}
                showEmpty={false}
                showAdd={false}
                onToggle={(item) => updateSessionItem(currentCampaignId, currentSessionId, item.id, { done: !item.done })}
                onEdit={(item) => setEditingItem({ item, isCreate: false })}
                onRemove={(item) => removeSessionItem(currentCampaignId, currentSessionId, item.id)}
                onAdd={openCreateItem}
            />

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] uppercase font-bold text-ui-muted tracking-wider">{t('sessionItem.quickAdd')}</span>
                {(['clue', 'loot', 'message', 'note'] as SessionItemKind[]).map((k) => (
                    <button
                        key={k}
                        onClick={() => openCreateItem(k)}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-ui-surface2 text-ui-muted hover:text-ui-text transition-colors flex items-center gap-1"
                    >
                        <span className={KIND_CONFIG[k].text}>{KIND_CONFIG[k].icon}</span>
                        + {t(KIND_CONFIG[k].addKey)}
                    </button>
                ))}
            </div>

            {unlinkedScenes.length > 0 && (
                <div className="flex flex-col gap-1">
                    <span className="text-ui-muted text-xs">{t('dashboard.addExistingScene')}</span>
                    <div className="flex flex-wrap gap-1">
                        {unlinkedScenes.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => addSceneToSession(currentCampaignId, currentSessionId, s.id)}
                                className="text-xs px-2 py-1 bg-ui-surface2 hover:bg-ui-surface text-ui-muted hover:text-ui-text rounded transition-colors"
                            >
                                + {s.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {editingItem && (
                <SessionItemModal
                    initial={editingItem.item}
                    isCreate={editingItem.isCreate}
                    onSave={saveItem}
                    onDelete={editingItem.isCreate ? undefined : () => {
                        removeSessionItem(currentCampaignId, currentSessionId, editingItem.item.id)
                        setEditingItem(null)
                    }}
                    onClose={() => setEditingItem(null)}
                />
            )}

        </div>
    )
}

export default SceneWidget
