import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import type { FogZone } from '../../types'
import { useT } from '../../i18n'

const ZOOM_SPEED = 0.1
const MIN_SCALE = 0.1
const MAX_SCALE = 5
const CONTAINER_HEIGHT = 380

type FogInteract =
    | { kind: 'drag'; zoneId: string; startPct: { x: number; y: number }; origZone: { x: number; y: number; w: number; h: number } }
    | { kind: 'resize'; zoneId: string; startPct: { x: number; y: number }; origZone: { x: number; y: number; w: number; h: number } }

type WidgetMode = 'fog' | 'viewport'

function MapFogWidget() {
    const t = useT()
    const { campaigns, currentCampaignId, updateCampaignMap } = useCampaignStore()

    const currentCampaign = useMemo(
        () => campaigns.find(c => c.id === currentCampaignId),
        [campaigns, currentCampaignId]
    )
    const mapData = currentCampaign?.map
    const activeMapStoredId = currentCampaign?.activeMapStoredId ?? null

    const [mode, setMode] = useState<WidgetMode>('fog')
    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const [isPlayerOpen, setIsPlayerOpen] = useState(false)

    // DM navigation state
    const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    // Fog editing state
    const [fogDraft, setFogDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
    const [fogInteract, setFogInteract] = useState<FogInteract | null>(null)
    const [liveZoneOverride, setLiveZoneOverride] = useState<{ id: string; x: number; y: number; w: number; h: number } | null>(null)

    // Player viewport state (independent from DM navigation)
    const [pvpOffset, setPvpOffset] = useState({ x: 0, y: 0 })
    const [pvpScale, setPvpScale] = useState(1)
    const [liveSync, setLiveSync] = useState(false)
    const lastSyncRef = useRef(0)
    const mapUrlRef = useRef<string | null>(null)
    const playerBoundsRef = useRef<{ width: number; height: number } | null>(null)

    const [fogPanning, setFogPanning] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        return () => { if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current) }
    }, [])

    useEffect(() => {
        if (!activeMapStoredId) {
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
            mapUrlRef.current = null
            // Intentional sync: clear map URL immediately when map is removed
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setMapUrl(null)
            return
        }
        let mounted = true
        window.electron.fs.getPlayerImage(activeMapStoredId).then((data) => {
            if (!mounted || !data) return
            if (mapUrlRef.current) URL.revokeObjectURL(mapUrlRef.current)
            const url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
            mapUrlRef.current = url
            setMapUrl(url)
        })
        return () => { mounted = false }
    }, [activeMapStoredId])

    // Auto-fit map to container on load
    useEffect(() => {
        if (!mapUrl) return
        const img = new Image()
        img.onload = () => {
            const cW = containerRef.current?.clientWidth ?? 800
            const fitScale = Math.min(cW / img.naturalWidth, CONTAINER_HEIGHT / img.naturalHeight)
            const s = Math.min(fitScale, 1)
            setScale(s)
            setPvpScale(s)
            const x = (cW - img.naturalWidth * s) / 2
            const y = (CONTAINER_HEIGHT - img.naturalHeight * s) / 2
            setOffset({ x, y })
            setPvpOffset({ x, y })
        }
        img.src = mapUrl
    }, [mapUrl])

    useEffect(() => {
        window.electron.player.isOpen().then(async (open) => {
            setIsPlayerOpen(open)
            if (open) playerBoundsRef.current = await window.electron.player.getWindowBounds()
        })
    }, [])

    useEffect(() => {
        const off = window.electron.on('player:closed', () => {
            setIsPlayerOpen(false)
            playerBoundsRef.current = null
        })
        return () => off()
    }, [])

    const fogZones = mapData?.fogZones ?? []
    const effectiveFogZones: FogZone[] = liveZoneOverride
        ? fogZones.map(z => z.id === liveZoneOverride.id ? { ...z, ...liveZoneOverride } : z)
        : fogZones

    const screenToImagePct = useCallback((e: React.MouseEvent): { x: number; y: number } => {
        const rect = mapRef.current?.getBoundingClientRect()
        if (!rect) return { x: 0, y: 0 }
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        }
    }, [])

    const startDragZone = useCallback((e: React.MouseEvent, zone: FogZone) => {
        e.stopPropagation()
        const pct = screenToImagePct(e)
        setFogInteract({ kind: 'drag', zoneId: zone.id, startPct: pct, origZone: { x: zone.x, y: zone.y, w: zone.w, h: zone.h } })
    }, [screenToImagePct])

    const startResizeZone = useCallback((e: React.MouseEvent, zone: FogZone) => {
        e.stopPropagation()
        const pct = screenToImagePct(e)
        setFogInteract({ kind: 'resize', zoneId: zone.id, startPct: pct, origZone: { x: zone.x, y: zone.y, w: zone.w, h: zone.h } })
    }, [screenToImagePct])

    const deleteZone = useCallback((id: string) => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            fogZones: (mapData?.fogZones ?? []).filter(z => z.id !== id),
        })
    }, [currentCampaignId, mapData, updateCampaignMap])

    const revealAll = useCallback(() => {
        if (!currentCampaignId) return
        updateCampaignMap(currentCampaignId, {
            fogZones: [{ id: crypto.randomUUID(), x: 0, y: 0, w: 100, h: 100 }],
        })
    }, [currentCampaignId, updateCampaignMap])

    const clearAllFog = useCallback(() => {
        if (!currentCampaignId) return
        if (!window.confirm(t('mapfog.clearFogConfirm'))) return
        updateCampaignMap(currentCampaignId, { fogZones: [] })
    }, [currentCampaignId, updateCampaignMap, t])

    // Optional-chained dep (mapData?.fogZones) makes React Compiler flag this memo; intentional for push-on-change
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const pushToPlayers = useCallback(async () => {
        if (!currentCampaignId || !mapUrl || !activeMapStoredId) return
        const bounds = await window.electron.player.getWindowBounds()
        if (bounds) playerBoundsRef.current = bounds
        const pw = playerBoundsRef.current?.width ?? 1920
        const ph = playerBoundsRef.current?.height ?? 1080
        const widgetW = containerRef.current?.clientWidth ?? 800
        const playerOffsetX = pvpOffset.x + (pw - widgetW) / 2
        const playerOffsetY = pvpOffset.y + (ph - CONTAINER_HEIGHT) / 2
        window.electron.player.setMap(activeMapStoredId)
        if (mapData?.fogZones !== undefined) {
            window.electron.player.setFog(mapData.fogZones)
        }
        window.electron.player.setViewport({ offsetX: playerOffsetX, offsetY: playerOffsetY, scale: pvpScale })
        updateCampaignMap(currentCampaignId, {
            playerViewport: { offsetX: playerOffsetX, offsetY: playerOffsetY, scale: pvpScale },
        })
    }, [currentCampaignId, mapUrl, activeMapStoredId, mapData?.fogZones, pvpOffset, pvpScale, updateCampaignMap])

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!mapUrl) return
        e.preventDefault()
        const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED
        const rect = containerRef.current?.getBoundingClientRect()
        if (!rect) return
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        if (mode === 'viewport') {
            const newScale = Math.min(Math.max(pvpScale + delta, MIN_SCALE), MAX_SCALE)
            const newOffset = {
                x: mouseX - ((mouseX - pvpOffset.x) / pvpScale) * newScale,
                y: mouseY - ((mouseY - pvpOffset.y) / pvpScale) * newScale,
            }
            setPvpScale(newScale)
            setPvpOffset(newOffset)
            if (liveSync) {
                const now = Date.now()
                if (now - lastSyncRef.current > 60) {
                    lastSyncRef.current = now
                    const pw = playerBoundsRef.current?.width ?? 1920
                    const ph = playerBoundsRef.current?.height ?? 1080
                    const widgetW = containerRef.current?.clientWidth ?? 800
                    window.electron.player.setViewport({
                        offsetX: newOffset.x + (pw - widgetW) / 2,
                        offsetY: newOffset.y + (ph - CONTAINER_HEIGHT) / 2,
                        scale: newScale,
                    })
                }
            }
            return
        }

        const newScale = Math.min(Math.max(scale + delta, MIN_SCALE), MAX_SCALE)
        setScale(newScale)
        setOffset({
            x: mouseX - ((mouseX - offset.x) / scale) * newScale,
            y: mouseY - ((mouseY - offset.y) / scale) * newScale,
        })
    }, [mapUrl, mode, scale, offset, pvpScale, pvpOffset, liveSync])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (mode === 'fog') {
            if (e.button === 2) {
                setFogPanning(true)
                setIsDragging(true)
                setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
                return
            }
            if (fogInteract) return
            const pct = screenToImagePct(e)
            setFogDraft({ x0: pct.x, y0: pct.y, x1: pct.x, y1: pct.y })
            setIsDragging(true)
            return
        }
        if (mode === 'viewport') {
            setIsDragging(true)
            setDragStart({ x: e.clientX - pvpOffset.x, y: e.clientY - pvpOffset.y })
        }
    }, [mode, offset, pvpOffset, fogInteract, screenToImagePct])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (mode === 'fog') {
            if (fogPanning && isDragging) {
                setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
                return
            }
            if (fogDraft && isDragging) {
                const pct = screenToImagePct(e)
                setFogDraft(d => d ? { ...d, x1: pct.x, y1: pct.y } : null)
                return
            }
            if (fogInteract) {
                const pct = screenToImagePct(e)
                const dx = pct.x - fogInteract.startPct.x
                const dy = pct.y - fogInteract.startPct.y
                if (fogInteract.kind === 'drag') {
                    const { origZone } = fogInteract
                    setLiveZoneOverride({
                        id: fogInteract.zoneId,
                        x: Math.max(0, Math.min(100 - origZone.w, origZone.x + dx)),
                        y: Math.max(0, Math.min(100 - origZone.h, origZone.y + dy)),
                        w: origZone.w, h: origZone.h,
                    })
                } else {
                    const { origZone } = fogInteract
                    setLiveZoneOverride({
                        id: fogInteract.zoneId,
                        x: origZone.x, y: origZone.y,
                        w: Math.max(2, origZone.w + dx),
                        h: Math.max(2, origZone.h + dy),
                    })
                }
                return
            }
            return
        }
        if (mode === 'viewport' && isDragging) {
            const newOffset = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }
            setPvpOffset(newOffset)
            if (liveSync) {
                const now = Date.now()
                if (now - lastSyncRef.current > 60) {
                    lastSyncRef.current = now
                    const pw = playerBoundsRef.current?.width ?? 1920
                    const ph = playerBoundsRef.current?.height ?? 1080
                    const widgetW = containerRef.current?.clientWidth ?? 800
                    window.electron.player.setViewport({
                        offsetX: newOffset.x + (pw - widgetW) / 2,
                        offsetY: newOffset.y + (ph - CONTAINER_HEIGHT) / 2,
                        scale: pvpScale,
                    })
                }
            }
        }
    }, [mode, fogPanning, fogDraft, fogInteract, isDragging, dragStart, pvpScale, liveSync, screenToImagePct])

    const handleMouseUp = useCallback(() => {
        if (mode === 'fog') {
            if (fogPanning) {
                setFogPanning(false)
                setIsDragging(false)
                return
            }
            if (fogDraft && currentCampaignId) {
                const x = Math.min(fogDraft.x0, fogDraft.x1)
                const y = Math.min(fogDraft.y0, fogDraft.y1)
                const w = Math.abs(fogDraft.x1 - fogDraft.x0)
                const h = Math.abs(fogDraft.y1 - fogDraft.y0)
                if (w > 1 && h > 1) {
                    updateCampaignMap(currentCampaignId, {
                        fogZones: [...(mapData?.fogZones ?? []), { id: crypto.randomUUID(), x, y, w, h }],
                    })
                }
            }
            if (fogInteract && liveZoneOverride && currentCampaignId) {
                updateCampaignMap(currentCampaignId, {
                    fogZones: (mapData?.fogZones ?? []).map(z =>
                        z.id === liveZoneOverride.id ? { ...z, ...liveZoneOverride } : z
                    ),
                })
            }
            setFogDraft(null)
            setFogInteract(null)
            setLiveZoneOverride(null)
        }
        setIsDragging(false)
    }, [mode, fogPanning, fogDraft, fogInteract, liveZoneOverride, currentCampaignId, mapData, updateCampaignMap])

    if (!currentCampaignId) return null

    const activeOffset = mode === 'viewport' ? pvpOffset : offset
    const activeScale = mode === 'viewport' ? pvpScale : scale

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-ui-surface2/40">
                <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted">{t('mapfog.mapControl')}</p>
                    <div className="flex bg-ui-bg p-0.5 rounded-lg border border-ui-surface2">
                        <button
                            onClick={() => setMode('fog')}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === 'fog' ? 'bg-arcane-light text-ui-text' : 'text-ui-muted hover:text-ui-text'}`}
                        >
                            {t('mapfog.fogOfWar')}
                        </button>
                        <button
                            onClick={() => setMode('viewport')}
                            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === 'viewport' ? 'bg-arcane-light text-ui-text' : 'text-ui-muted hover:text-ui-text'}`}
                        >
                            {t('mapfog.playerView')}
                        </button>
                    </div>
                    <span className="text-[10px] text-ui-muted italic">
                        {mode === 'fog'
                            ? t('mapfog.fogHint')
                            : t('mapfog.viewportHint')}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {mode === 'fog' && (
                        <>
                            <button onClick={revealAll} className="px-2 py-1 text-xs bg-ui-surface2 text-ui-text rounded-lg border border-ui-surface2 hover:bg-ui-surface transition-colors">
                                {t('mapfog.revealAll')}
                            </button>
                            <button onClick={clearAllFog} className="px-2 py-1 text-xs bg-red-900/10 text-red-500 border border-red-900/20 rounded-lg hover:bg-red-900/20 transition-colors">
                                {t('mapfog.clearFog')}
                            </button>
                        </>
                    )}
                    {mode === 'viewport' && isPlayerOpen && (
                        <button
                            onClick={() => setLiveSync(s => !s)}
                            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${liveSync ? 'bg-danger-primary/20 text-danger-primary border-danger-primary/40' : 'bg-ui-surface2 text-ui-muted border-ui-surface2 hover:text-ui-text'}`}
                        >
                            {liveSync ? t('mapfog.liveOn') : t('mapfog.liveOff')}
                        </button>
                    )}
                    {isPlayerOpen && (
                        <button
                            onClick={pushToPlayers}
                            disabled={!mapUrl}
                            className="px-2 py-1 text-xs bg-danger-primary text-white rounded-lg hover:bg-danger-primary/80 transition-colors disabled:opacity-50"
                        >
                            {t('mapfog.pushToPlayers')}
                        </button>
                    )}
                </div>
            </div>

            {/* Map editor */}
            <div
                ref={containerRef}
                className="relative bg-ui-bg overflow-hidden select-none"
                style={{
                    height: CONTAINER_HEIGHT,
                    cursor: (mode === 'viewport' || fogPanning)
                        ? (isDragging ? 'grabbing' : 'grab')
                        : 'crosshair',
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onContextMenu={e => e.preventDefault()}
            >
                {!mapUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-ui-muted gap-2">
                        <p className="text-sm">{t('mapfog.noMapSet')}</p>
                        <p className="text-xs opacity-60">{t('mapfog.setMapCanvasHint')}</p>
                    </div>
                ) : (
                    <div
                        ref={mapRef}
                        style={{
                            transform: `translate(${activeOffset.x}px, ${activeOffset.y}px) scale(${activeScale})`,
                            transformOrigin: '0 0',
                        }}
                        className="relative inline-block"
                    >
                        <img
                            src={mapUrl}
                            alt={t('mapfog.campaignMapAlt')}
                            className="max-w-none block pointer-events-none"
                            draggable={false}
                        />

                        {/* Fog overlay */}
                        {(effectiveFogZones.length > 0 || mode === 'fog') && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                                <defs>
                                    <mask id="fog-mask-widget">
                                        <rect width="100%" height="100%" fill="white" />
                                        {effectiveFogZones.map(zone => (
                                            <rect
                                                key={zone.id}
                                                x={`${zone.x}%`} y={`${zone.y}%`}
                                                width={`${zone.w}%`} height={`${zone.h}%`}
                                                fill="black"
                                            />
                                        ))}
                                    </mask>
                                </defs>
                                {mode === 'fog' && (
                                    <image href={mapUrl} width="100%" height="100%" opacity="0.55" />
                                )}
                                <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#fog-mask-widget)" />
                                {mode === 'fog' && fogDraft && (() => {
                                    const x = Math.min(fogDraft.x0, fogDraft.x1)
                                    const y = Math.min(fogDraft.y0, fogDraft.y1)
                                    const w = Math.abs(fogDraft.x1 - fogDraft.x0)
                                    const h = Math.abs(fogDraft.y1 - fogDraft.y0)
                                    return (
                                        <rect
                                            x={`${x}%`} y={`${y}%`}
                                            width={`${w}%`} height={`${h}%`}
                                            fill="rgba(100,200,255,0.2)"
                                            stroke="rgba(100,200,255,0.8)"
                                            strokeWidth={2 / activeScale}
                                            strokeDasharray={`${6 / activeScale},${4 / activeScale}`}
                                        />
                                    )
                                })()}
                            </svg>
                        )}

                        {/* Zone handles — fog mode only */}
                        {mode === 'fog' && effectiveFogZones.map(zone => (
                            <div
                                key={zone.id}
                                style={{
                                    position: 'absolute',
                                    left: `${zone.x}%`, top: `${zone.y}%`,
                                    width: `${zone.w}%`, height: `${zone.h}%`,
                                    cursor: 'move',
                                    border: '2px solid rgba(100,200,255,0.7)',
                                    boxSizing: 'border-box',
                                }}
                                onMouseDown={e => startDragZone(e, zone)}
                            >
                                <button
                                    style={{ position: 'absolute', top: -10, right: -10, width: 18, height: 18, fontSize: 10, background: 'rgba(200,50,50,0.9)', color: 'white', borderRadius: 4, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onMouseDown={e => e.stopPropagation()}
                                    onClick={e => { e.stopPropagation(); deleteZone(zone.id) }}
                                >
                                    x
                                </button>
                                <div
                                    style={{ position: 'absolute', bottom: -5, right: -5, width: 12, height: 12, background: 'rgba(100,200,255,0.9)', borderRadius: 2, cursor: 'se-resize' }}
                                    onMouseDown={e => startResizeZone(e, zone)}
                                />
                            </div>
                        ))}

                        {/* Player viewport preview — viewport mode only */}
                        {/* Reads mapRef.current during render to compute preview rect; intentional for live preview */}
                        {/* eslint-disable-next-line react-hooks/refs */}
                        {mode === 'viewport' && (() => {
                            const imgW = mapRef.current?.offsetWidth ?? 1
                            const imgH = mapRef.current?.offsetHeight ?? 1
                            const pw = playerBoundsRef.current?.width ?? (containerRef.current?.clientWidth ?? 1920)
                            const ph = playerBoundsRef.current?.height ?? CONTAINER_HEIGHT
                            const widgetW = containerRef.current?.clientWidth ?? 800
                            const rx = (widgetW / 2 - pvpOffset.x - pw / 2) / pvpScale / imgW * 100
                            const ry = (CONTAINER_HEIGHT / 2 - pvpOffset.y - ph / 2) / pvpScale / imgH * 100
                            const rw = pw / pvpScale / imgW * 100
                            const rh = ph / pvpScale / imgH * 100
                            return (
                                <div style={{
                                    position: 'absolute',
                                    left: `${rx}%`, top: `${ry}%`,
                                    width: `${rw}%`, height: `${rh}%`,
                                    border: '2px dashed rgba(255,200,50,0.85)',
                                    pointerEvents: 'none',
                                    boxSizing: 'border-box',
                                }} />
                            )
                        })()}
                    </div>
                )}

                {/* Reset view button */}
                <button
                    onClick={() => {
                        if (!mapUrl) return
                        const img = new Image()
                        img.onload = () => {
                            const cW = containerRef.current?.clientWidth ?? 800
                            const s = Math.min(cW / img.naturalWidth, CONTAINER_HEIGHT / img.naturalHeight, 1)
                            const x = (cW - img.naturalWidth * s) / 2
                            const y = (CONTAINER_HEIGHT - img.naturalHeight * s) / 2
                            if (mode === 'viewport') { setPvpScale(s); setPvpOffset({ x, y }) }
                            else { setScale(s); setOffset({ x, y }) }
                        }
                        img.src = mapUrl
                    }}
                    title={t('mapfog.resetView')}
                    className="absolute bottom-2 right-2 p-1.5 bg-ui-surface rounded-lg border border-ui-surface2 text-ui-muted hover:text-ui-text transition-colors text-xs shadow"
                >
                    ⌂
                </button>
            </div>

            {!isPlayerOpen && (
                <div className="px-4 py-2 border-t border-ui-surface2/40">
                    <p className="text-[10px] text-ui-muted text-center">{t('mapfog.openPlayerWindow')}</p>
                </div>
            )}
        </div>
    )
}

export default MapFogWidget
