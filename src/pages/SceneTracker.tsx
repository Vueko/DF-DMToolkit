import { useState, useMemo, type ReactNode } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { Scene, SceneFlagType, SessionItem, SessionItemKind } from '../types'
import { SharedMarkdown } from '../components/SharedMarkdown'
import { useLaunchEncounter } from '../hooks/useLaunchEncounter'
import { Button, Input, Select, Textarea } from '../components/ui'
import { BoltIcon, ClockIcon, ScalesIcon } from '../components/icons'
import { useT } from '../i18n'
import { RequirementNotice } from '../components/ui/RequirementNotice'
import { groupSessionItems } from '../components/session/groupSessionItems'
import SessionItemSections from '../components/session/SessionItemSections'
import SessionItemModal from '../components/session/SessionItemModal'
import { KIND_CONFIG } from '../components/session/SessionItemRow'

// Scenes en la vista unificada se listan por estado: activas primero, luego próximas, luego hechas.
const STATUS_ORDER: Record<Scene['status'], number> = { active: 0, upcoming: 1, completed: 2 }

const FLAG_CONFIG: Record<SceneFlagType, { icon: ReactNode; bg: string; border: string; text: string; activeBg: string; label: string; placeholder: string }> = {
    event:    { icon: <BoltIcon className="w-4 h-4"/>, bg: 'bg-danger-primary/10', border: 'border-danger-primary/25', text: 'text-danger-primary', activeBg: 'bg-danger-primary/20 border-danger-primary/50',  label: 'scenes.flagTypeEvent',    placeholder: 'scenes.flagPlaceholderEvent' },
    time:     { icon: <ClockIcon className="w-4 h-4"/>, bg: 'bg-amber-500/10',   border: 'border-amber-400/30',    text: 'text-amber-700',   activeBg: 'bg-amber-500/20 border-amber-400/50',           label: 'scenes.flagTypeTime',     placeholder: 'scenes.flagPlaceholderTime' },
    decision: { icon: <ScalesIcon className="w-4 h-4"/>, bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',     text: 'text-cyan-700',    activeBg: 'bg-cyan-500/20 border-cyan-500/50',             label: 'scenes.flagTypeDecision', placeholder: 'scenes.flagPlaceholderDecision' },
}

function SceneTracker() {
    const t = useT()
    const { campaigns, currentCampaignId, updateScene, addScene, removeScene,
        addSessionItem, updateSessionItem, removeSessionItem } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const launchEncounter = useLaunchEncounter()

    const [editingScene, setEditingScene] = useState<Scene | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newFlag, setNewFlag] = useState('')
    const [newFlagType, setNewFlagType] = useState<SceneFlagType>('event')
    const [newDescription, setNewDescription] = useState('')
    const [newReadAloud, setNewReadAloud] = useState('')
    const [newEncounterId, setNewEncounterId] = useState('')
    const [newCountMax, setNewCountMax] = useState(0)
    const [descriptionMode, setDescriptionMode] = useState<'write' | 'preview'>('write')
    const [selectedSessionId, setSelectedSessionId] = useState<string>('all')
    const [editingItem, setEditingItem] = useState<{ item: SessionItem; isCreate: boolean } | null>(null)
    const [newMenuOpen, setNewMenuOpen] = useState(false)

    const scenes = useMemo(() => currentCampaign?.scenes ?? [], [currentCampaign?.scenes])
    const sessions = useMemo(() => currentCampaign?.sessions ?? [], [currentCampaign?.sessions])

    const visibleScenes = useMemo(() => {
        if (selectedSessionId === 'all') return scenes
        if (selectedSessionId === 'unassigned') {
            const assignedIds = new Set(sessions.flatMap((s) => s.sceneIds))
            return scenes.filter((s) => !assignedIds.has(s.id))
        }
        const session = sessions.find((s) => s.id === selectedSessionId)
        if (!session) return []
        return scenes.filter((s) => session.sceneIds.includes(s.id))
    }, [scenes, sessions, selectedSessionId])

    const sessionSceneCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const s of sessions) {
            counts[s.id] = s.sceneIds.filter((id) => scenes.some((sc) => sc.id === id)).length
        }
        return counts
    }, [sessions, scenes])

    const unassignedCount = useMemo(() => {
        const assignedIds = new Set(sessions.flatMap((s) => s.sceneIds))
        return scenes.filter((s) => !assignedIds.has(s.id)).length
    }, [sessions, scenes])

    const selectedSession = sessions.find((s) => s.id === selectedSessionId)
    const groupedItems = useMemo(() => groupSessionItems(selectedSession?.items), [selectedSession?.items])
    const sortedScenes = useMemo(
        () => [...visibleScenes].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]),
        [visibleScenes],
    )

    if (!currentCampaignId || !currentCampaign) {
        return <RequirementNotice title={t('scenes.noCampaignSelected')} hint={t('scenes.noCampaignHint')} link="/campaigns" linkLabel={t('nav.campaigns')} />
    }

    const openCreateItem = (kind: SessionItemKind) =>
        setEditingItem({ item: { id: crypto.randomUUID(), kind, title: '', done: false }, isCreate: true })

    const saveItem = (draft: SessionItem) => {
        if (!currentCampaignId || selectedSessionId === 'all' || selectedSessionId === 'unassigned') return
        if (editingItem?.isCreate) addSessionItem(currentCampaignId, selectedSessionId, draft)
        else updateSessionItem(currentCampaignId, selectedSessionId, draft.id, draft)
        setEditingItem(null)
    }

    const startCreateScene = () => { setIsCreating(true); setDescriptionMode('write') }

    const handleCreateScene = () => {
        if (!newTitle.trim()) return
        const scene: Scene = {
            id: crypto.randomUUID(),
            title: newTitle.trim(),
            status: 'upcoming',
            flag: newFlag.trim(),
            flagType: newFlagType,
            count: 0,
            countMax: newCountMax > 0 ? newCountMax : undefined,
            description: newDescription.trim(),
            readAloud: newReadAloud.trim() || undefined,
            encounterId: newEncounterId || undefined,
        }
        addScene(currentCampaignId, scene)
        setIsCreating(false)
        setNewTitle('')
        setNewFlag('')
        setNewFlagType('event')
        setNewDescription('')
        setNewReadAloud('')
        setNewEncounterId('')
        setNewCountMax(0)
    }

    const handleUpdateScene = (id: string, updates: Partial<Scene>) => {
        updateScene(currentCampaignId, id, updates)
        if (editingScene?.id === id) {
            setEditingScene({ ...editingScene, ...updates })
        }
    }

    const nextStatus: Record<Scene['status'], Scene['status']> = {
        upcoming: 'active',
        active: 'completed',
        completed: 'upcoming',
    }

    const statusConfig: Record<Scene['status'], { label: string; badge: string }> = {
        upcoming: { label: 'scenes.statusUpcoming', badge: 'bg-ui-surface2 text-ui-muted hover:bg-ui-surface border border-ui-surface2' },
        active:   { label: 'scenes.statusActive',   badge: 'bg-danger-primary text-white hover:bg-danger-gold' },
        completed:{ label: 'scenes.statusDone',     badge: 'bg-arcane-light/20 text-arcane-light hover:bg-arcane-light/30 border border-arcane-light/30' },
    }

    const renderSceneCard = (scene: Scene) => {
        const cfg = statusConfig[scene.status]
        const hasCountdown = (scene.countMax ?? 0) > 0
        const count = scene.count ?? 0
        const max = scene.countMax ?? 1
        const pct = hasCountdown ? Math.min(100, (count / max) * 100) : 0
        const isFull = hasCountdown && count >= max

        return (
            <div
                key={scene.id}
                onClick={() => {
                    setEditingScene(scene)
                    setDescriptionMode(scene.description ? 'preview' : 'write')
                }}
                className={`bg-card-bg border rounded-xl p-4 cursor-pointer transition-all flex flex-col gap-2.5 ${
                    isFull
                        ? 'border-danger-gold/60 hover:border-danger-gold shadow-[0_0_0_1px_rgba(var(--color-danger-gold),0.15)]'
                        : 'border-card-border hover:border-danger-primary/50'
                }`}
            >
                {/* Title + status */}
                <div className="flex items-start justify-between gap-2">
                    <h4 className="text-card-text font-semibold text-sm leading-tight flex-1 min-w-0">{scene.title}</h4>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            handleUpdateScene(scene.id, { status: nextStatus[scene.status] })
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wide transition-colors shrink-0 ${cfg.badge}`}
                    >
                        {t(cfg.label)}
                    </button>
                </div>

                {/* Trigger flag — typed */}
                {scene.flag && (() => {
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
                })()}

                {/* Read-aloud */}
                {scene.readAloud && (
                    <p className="border-l-2 border-danger-gold/60 pl-2 text-[11px] italic text-card-text/80 line-clamp-2">
                        {scene.readAloud}
                    </p>
                )}

                {/* Linked encounter */}
                {scene.encounterId && (() => {
                    const linked = (currentCampaign.encounters ?? []).find((enc) => enc.id === scene.encounterId)
                    if (!linked) return null
                    return (
                        <button
                            onClick={(e) => { e.stopPropagation(); launchEncounter(linked, currentCampaignId) }}
                            className="self-start text-[10px] font-bold px-2 py-1 rounded-lg bg-danger-primary/15 text-danger-primary hover:bg-danger-primary/25 transition-colors"
                        >
                            ⚔ {t('scenes.launchEncounter')}: {linked.name}
                        </button>
                    )
                })()}

                {/* Description preview */}
                {scene.description && (
                    <p className="text-card-text/70 text-xs leading-relaxed line-clamp-2">
                        {scene.description.replace(/[#*_`[\]]/g, '').trim()}
                    </p>
                )}

                {/* Countdown clock */}
                {hasCountdown && (
                    <div className="flex flex-col gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-danger-gold' : 'text-ui-muted'}`}>
                                {isFull ? `⚠ ${t('scenes.clockFull')}` : `⏱ ${t('scenes.clock')}`}
                            </span>
                            <span className={`text-xs font-bold tabular-nums ${isFull ? 'text-danger-gold' : 'text-ui-text'}`}>
                                {count} / {max}
                            </span>
                        </div>
                        <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-danger-gold' : 'bg-danger-primary'}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.max(0, count - 1) })}
                                disabled={count <= 0}
                                className="w-6 h-6 bg-ui-surface2 hover:bg-arcane-light/30 text-ui-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                            >−</button>
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.min(max, count + 1) })}
                                disabled={isFull}
                                className="w-6 h-6 bg-ui-surface2 hover:bg-danger-primary/30 text-ui-text text-xs font-bold rounded transition-colors flex items-center justify-center disabled:opacity-30"
                            >+</button>
                        </div>
                    </div>
                )}

                {/* Simple counter (no max set) */}
                {!hasCountdown && (
                    <div className="flex items-center gap-2 pt-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] uppercase font-bold text-ui-muted tracking-wider">{t('scenes.count')}</span>
                        <div className="flex items-center gap-1 bg-ui-bg/60 rounded-lg px-1.5 py-0.5 ml-auto">
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: Math.max(0, count - 1) })}
                                className="text-ui-muted hover:text-ui-text transition-colors text-xs w-4 text-center"
                            >−</button>
                            <span className="text-xs font-mono font-bold text-ui-text w-5 text-center">{count}</span>
                            <button
                                onClick={() => handleUpdateScene(scene.id, { count: count + 1 })}
                                className="text-ui-muted hover:text-ui-text transition-colors text-xs w-4 text-center"
                            >+</button>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-full overflow-hidden">

            {/* Sessions sidebar */}
            <div className="w-52 shrink-0 flex flex-col border-r border-ui-surface2 overflow-y-auto bg-ui-surface/30">
                <div className="px-4 pt-5 pb-3 shrink-0">
                    <h1 className="text-ui-text font-display text-lg font-bold">{t('scenes.title')}</h1>
                    <p className="text-ui-muted text-xs mt-0.5 truncate">{currentCampaign.name}</p>
                </div>

                <nav className="px-2 pb-4 flex flex-col gap-0.5">
                    <button
                        onClick={() => setSelectedSessionId('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSessionId === 'all'
                                ? 'bg-danger-primary/15 text-danger-primary font-semibold'
                                : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                        }`}
                    >
                        <span>{t('scenes.allScenes')}</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{scenes.length}</span>
                    </button>

                    <button
                        onClick={() => setSelectedSessionId('unassigned')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedSessionId === 'unassigned'
                                ? 'bg-danger-primary/15 text-danger-primary font-semibold'
                                : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                        }`}
                    >
                        <span>{t('scenes.unassigned')}</span>
                        <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold">{unassignedCount}</span>
                    </button>

                    {sessions.length > 0 && (
                        <>
                            <div className="px-3 pt-3 pb-1">
                                <span className="text-[10px] text-ui-muted uppercase font-bold tracking-widest">{t('scenes.sessions')}</span>
                            </div>
                            {sessions.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedSessionId(s.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                                        selectedSessionId === s.id
                                            ? 'bg-danger-primary/15 text-danger-primary font-semibold'
                                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
                                    }`}
                                >
                                    <span className="truncate pr-1">{s.name}</span>
                                    <span className="text-[10px] bg-ui-surface2 px-1.5 py-0.5 rounded-full text-ui-muted font-bold shrink-0">
                                        {sessionSceneCounts[s.id] ?? 0}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}

                    {sessions.length === 0 && (
                        <p className="px-3 py-2 text-xs text-ui-muted italic">{t('scenes.noSessions')}</p>
                    )}
                </nav>
            </div>

            {/* Main Kanban area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 shrink-0 border-b border-ui-surface2">
                    <div>
                        <h2 className="text-ui-text font-semibold">
                            {selectedSessionId === 'all'
                                ? t('scenes.allScenes')
                                : selectedSessionId === 'unassigned'
                                ? t('scenes.unassignedScenes')
                                : selectedSession?.name ?? t('scenes.session')}
                        </h2>
                        <p className="text-ui-muted text-xs">{t(visibleScenes.length === 1 ? 'scenes.sceneCountOne' : 'scenes.sceneCountOther', { count: visibleScenes.length })}</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setNewMenuOpen((o) => !o)}
                            className="px-4 py-2 bg-danger-primary hover:bg-danger-gold text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
                        >
                            + {t('sessionLog.new')}
                            <span className="text-[10px]">▾</span>
                        </button>
                        {newMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setNewMenuOpen(false)} />
                                <div className="absolute right-0 mt-1 z-50 w-44 bg-ui-surface border border-ui-surface2 rounded-lg shadow-xl py-1 flex flex-col">
                                    <button
                                        onClick={() => { setNewMenuOpen(false); startCreateScene() }}
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text hover:bg-ui-surface2 transition-colors text-left"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-danger-primary shrink-0" />
                                        {t('sessionLog.newScene')}
                                    </button>
                                    {selectedSession && (['clue', 'loot', 'message', 'note'] as SessionItemKind[]).map((k) => {
                                        const cfg = KIND_CONFIG[k]
                                        return (
                                            <button
                                                key={k}
                                                onClick={() => { setNewMenuOpen(false); openCreateItem(k) }}
                                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-ui-text hover:bg-ui-surface2 transition-colors text-left"
                                            >
                                                <span className={cfg.text}>{cfg.icon}</span>
                                                {t(cfg.kindKey)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-5 flex flex-col gap-6">

                    {/* Scenes — ahora una sección más del registro, junto a pistas/botín/etc. */}
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-danger-primary shrink-0" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-ui-muted">{t('sessionLog.scenesSection')}</h4>
                            <span className="text-[10px] bg-ui-surface2 px-1.5 rounded-full text-ui-muted font-bold">{sortedScenes.length}</span>
                        </div>
                        {sortedScenes.length === 0 ? (
                            <p className="text-[11px] text-ui-muted italic px-1">{t('sessionLog.noScenes')}</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                                {sortedScenes.map(renderSceneCard)}
                            </div>
                        )}
                    </div>

                    {/* Pistas / botín / mensajes / notas — solo con una sesión concreta seleccionada */}
                    {selectedSession && (
                        <SessionItemSections
                            grouped={groupedItems}
                            showEmpty
                            showAdd={false}
                            onToggle={(item) => updateSessionItem(currentCampaignId, selectedSession.id, item.id, { done: !item.done })}
                            onEdit={(item) => setEditingItem({ item, isCreate: false })}
                            onRemove={(item) => removeSessionItem(currentCampaignId, selectedSession.id, item.id)}
                            onAdd={openCreateItem}
                        />
                    )}
                </div>
            </div>

            {/* Modal */}
            {(editingScene || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ui-bg/80 backdrop-blur-sm">
                    <div className="bg-ui-surface w-full max-w-2xl rounded-2xl border border-ui-surface2 shadow-2xl flex flex-col max-h-[90vh]">

                        <div className="flex items-center justify-between p-6 border-b border-ui-surface2">
                            <h2 className="text-xl font-display font-semibold text-ui-text">
                                {isCreating ? t('scenes.createTitle') : t('scenes.editTitle')}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => { setEditingScene(null); setIsCreating(false) }}>✕</Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.sceneTitle')}</label>
                                <Input
                                    theme="danger"
                                    type="text"
                                    value={editingScene ? editingScene.title : newTitle}
                                    onChange={(e) => editingScene
                                        ? handleUpdateScene(editingScene.id, { title: e.target.value })
                                        : setNewTitle(e.target.value)
                                    }
                                    placeholder={t('scenes.sceneTitlePlaceholder')}
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.triggerType')}</label>
                                    <div className="flex gap-1.5">
                                        {(['event', 'time', 'decision'] as SceneFlagType[]).map((type) => {
                                            const cfg = FLAG_CONFIG[type]
                                            const current = editingScene ? (editingScene.flagType ?? 'event') : newFlagType
                                            const isActive = current === type
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => editingScene
                                                        ? handleUpdateScene(editingScene.id, { flagType: type })
                                                        : setNewFlagType(type)
                                                    }
                                                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                                        isActive
                                                            ? `${cfg.activeBg} ${cfg.text}`
                                                            : 'bg-ui-surface2 border-ui-surface2 text-ui-muted hover:text-ui-text'
                                                    }`}
                                                >
                                                    <span>{cfg.icon}</span>
                                                    <span className="capitalize">{t(cfg.label)}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.triggerCondition')}</label>
                                    <Input
                                        theme="danger"
                                        type="text"
                                        value={editingScene ? editingScene.flag : newFlag}
                                        onChange={(e) => editingScene
                                            ? handleUpdateScene(editingScene.id, { flag: e.target.value })
                                            : setNewFlag(e.target.value)
                                        }
                                        placeholder={t(FLAG_CONFIG[editingScene ? (editingScene.flagType ?? 'event') : newFlagType].placeholder)}
                                    />
                                </div>

                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">📢 {t('scenes.readAloud')}</label>
                                <Textarea
                                    theme="danger"
                                    rows={3}
                                    value={editingScene ? (editingScene.readAloud ?? '') : newReadAloud}
                                    onChange={(e) => editingScene
                                        ? handleUpdateScene(editingScene.id, { readAloud: e.target.value.trim() === '' ? undefined : e.target.value })
                                        : setNewReadAloud(e.target.value)
                                    }
                                    placeholder={t('scenes.readAloudPlaceholder')}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">⚔ {t('scenes.linkedEncounter')}</label>
                                <Select
                                    theme="danger"
                                    value={editingScene ? (editingScene.encounterId ?? '') : newEncounterId}
                                    onChange={(e) => editingScene
                                        ? handleUpdateScene(editingScene.id, { encounterId: e.target.value || undefined })
                                        : setNewEncounterId(e.target.value)
                                    }
                                >
                                    <option value="">{t('scenes.noEncounter')}</option>
                                    {(currentCampaign.encounters ?? []).map((enc) => (
                                        <option key={enc.id} value={enc.id}>{enc.name}</option>
                                    ))}
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">⏱ {t('scenes.countdownClock')}</label>
                                <div className="flex items-center gap-3">
                                    <div className="w-36 shrink-0">
                                        <Input
                                            theme="danger"
                                            type="number"
                                            min={0}
                                            value={editingScene ? (editingScene.countMax ?? 0) : newCountMax}
                                            onChange={(e) => {
                                                const val = Math.max(0, +e.target.value)
                                                if (editingScene) {
                                                    handleUpdateScene(editingScene.id, {
                                                        countMax: val > 0 ? val : undefined,
                                                        count: Math.min(editingScene.count ?? 0, val),
                                                    })
                                                } else {
                                                    setNewCountMax(val)
                                                }
                                            }}
                                            placeholder={t('scenes.countMaxPlaceholder')}
                                        />
                                    </div>
                                    {(() => {
                                        const max = editingScene ? (editingScene.countMax ?? 0) : newCountMax
                                        const count = editingScene ? (editingScene.count ?? 0) : 0
                                        const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0
                                        return max > 0 ? (
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="flex justify-between text-xs text-ui-muted">
                                                    <span>{t('scenes.progress')}</span>
                                                    <span className="font-bold text-ui-text">{count} / {max}</span>
                                                </div>
                                                <div className="h-2 bg-ui-surface2 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full bg-danger-primary transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-ui-muted flex-1">{t('scenes.countdownHint')}</p>
                                        )
                                    })()}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-ui-muted uppercase tracking-wider">{t('scenes.description')}</label>
                                    <div className="flex bg-ui-bg border border-ui-surface2 rounded p-0.5">
                                        <button
                                            onClick={() => setDescriptionMode('write')}
                                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'write' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                                        >{t('scenes.write')}</button>
                                        <button
                                            onClick={() => setDescriptionMode('preview')}
                                            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${descriptionMode === 'preview' ? 'bg-ui-surface text-ui-text shadow-sm' : 'text-ui-muted hover:text-ui-text'}`}
                                        >{t('scenes.preview')}</button>
                                    </div>
                                </div>
                                {descriptionMode === 'write' ? (
                                    <Textarea
                                        theme="danger"
                                        value={editingScene ? editingScene.description || '' : newDescription}
                                        onChange={(e) => editingScene
                                            ? handleUpdateScene(editingScene.id, { description: e.target.value })
                                            : setNewDescription(e.target.value)
                                        }
                                        className="flex-1 font-mono"
                                        placeholder={t('scenes.descriptionPlaceholder')}
                                    />
                                ) : (
                                    <div className="w-full bg-ui-surface border border-ui-surface2 rounded-xl p-4 overflow-y-auto min-h-[160px] prose max-w-none text-ui-text">
                                        {(editingScene ? editingScene.description : newDescription) ? (
                                            <SharedMarkdown>{(editingScene ? editingScene.description : newDescription) || ''}</SharedMarkdown>
                                        ) : (
                                            <p className="italic opacity-50 text-sm">{t('scenes.nothingWritten')}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-ui-surface2 flex justify-between bg-ui-surface/50 rounded-b-2xl">
                            {editingScene ? (
                                <Button variant="destructive" onClick={() => { removeScene(currentCampaignId, editingScene.id); setEditingScene(null) }}>
                                    {t('scenes.deleteScene')}
                                </Button>
                            ) : (
                                <div />
                            )}
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={() => { setEditingScene(null); setIsCreating(false) }}>
                                    {isCreating ? t('scenes.cancel') : t('scenes.close')}
                                </Button>
                                {isCreating && (
                                    <button
                                        onClick={handleCreateScene}
                                        disabled={!newTitle.trim()}
                                        className="px-6 py-2 text-sm bg-danger-primary hover:bg-danger-gold text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('scenes.createScene')}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {editingItem && (
                <SessionItemModal
                    initial={editingItem.item}
                    isCreate={editingItem.isCreate}
                    onSave={saveItem}
                    onDelete={editingItem.isCreate ? undefined : () => {
                        if (selectedSession) removeSessionItem(currentCampaignId, selectedSession.id, editingItem.item.id)
                        setEditingItem(null)
                    }}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </div>
    )
}

export default SceneTracker
