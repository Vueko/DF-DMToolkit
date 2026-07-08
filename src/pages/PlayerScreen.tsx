import { useState, useEffect, useRef, useCallback } from 'react'
import type { FogZone, PlayerViewport, PlayerInitiativePayload } from '../types'

interface OverlayState {
    dataUrl: string
    name: string
}

const ZOOM_SPEED = 0.1
const MIN_SCALE = 0.1
const MAX_SCALE = 10

function PlayerScreen() {
    const [mapUrl, setMapUrl] = useState<string | null>(null)
    const [overlay, setOverlay] = useState<OverlayState | null>(null)
    const [fogZones, setFogZones] = useState<FogZone[] | null>(null)

    const [scale, setScale] = useState(1)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [rotation, setRotation] = useState<0 | 90>(0)
    const [initiative, setInitiative] = useState<PlayerInitiativePayload | null>(null)

    // Refs for use inside non-reactive event handlers
    const scaleRef = useRef(scale)
    const offsetRef = useRef(offset)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const currentMapIdRef = useRef<string | null>(null)
    // Intentionally update refs during render so event handlers always read the latest value without stale closures
    // eslint-disable-next-line react-hooks/refs
    scaleRef.current = scale
    // eslint-disable-next-line react-hooks/refs
    offsetRef.current = offset

    // IPC listeners
    useEffect(() => {
        let mounted = true

        const toDataUrl = async (storedId: string): Promise<string | null> => {
            const data = await window.electron.fs.getPlayerImage(storedId)
            if (!mounted || !data) return null
            return URL.createObjectURL(new Blob([new Uint8Array(data)]))
        }

        const offMap = window.electron.on('player:set-map', (storedId) => {
            const id = storedId as string
            // Ignora el re-push del MISMO mapa para no recargar la imagen (ni resetear su pan/zoom).
            // El fog y la rotación se aplican por sus propios handlers. Un mapa distinto carga + auto-fit.
            if (id === currentMapIdRef.current) return
            currentMapIdRef.current = id
            toDataUrl(id).then((url) => {
                if (!mounted || !url) return
                setMapUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return url
                })
            })
        })

        const offCampaignMap = window.electron.on('player:set-campaign-map', (storedId) => {
            window.electron.fs.getMapImage(storedId as string).then((data) => {
                if (!mounted || !data) return
                const url = URL.createObjectURL(new Blob([new Uint8Array(data)]))
                setMapUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev)
                    return url
                })
            })
        })

        const offClearMap = window.electron.on('player:clear-map', () => {
            currentMapIdRef.current = null
            setMapUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev)
                return null
            })
        })

        const offOverlay = window.electron.on('player:show-overlay', (storedId, name) => {
            toDataUrl(storedId as string).then((url) => {
                if (!mounted || !url) return
                setOverlay((prev) => {
                    if (prev) URL.revokeObjectURL(prev.dataUrl)
                    return { dataUrl: url, name: name as string }
                })
            })
        })

        const offClearOverlay = window.electron.on('player:clear-overlay', () => {
            setOverlay((prev) => {
                if (prev) URL.revokeObjectURL(prev.dataUrl)
                return null
            })
        })

        const offFog = window.electron.on('player:set-fog', (zones) => {
            if (!mounted) return
            setFogZones(zones as FogZone[])
        })

        // DM viewport override — sets the local pan/zoom directly
        const offViewport = window.electron.on('player:set-viewport', (vp) => {
            if (!mounted) return
            const { offsetX, offsetY, scale: s } = vp as PlayerViewport
            setScale(s)
            setOffset({ x: offsetX, y: offsetY })
        })

        const offRotation = window.electron.on('player:set-rotation', (rot) => {
            if (!mounted) return
            setRotation((rot === 90 ? 90 : 0) as 0 | 90)
        })

        const offInitiative = window.electron.on('player:set-initiative', (payload) => {
            if (!mounted) return
            setInitiative(payload as PlayerInitiativePayload | null)
        })

        window.electron.player.ready?.()

        return () => {
            mounted = false
            offMap()
            offCampaignMap()
            offClearMap()
            offOverlay()
            offClearOverlay()
            offFog()
            offViewport()
            offRotation()
            offInitiative()
        }
    }, [])

    // Auto-fit when the map changes
    useEffect(() => {
        if (!mapUrl) {
            // Intentional sync: reset pan/zoom state immediately when map is cleared
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setScale(1)
            setOffset({ x: 0, y: 0 })
            return
        }
        const img = new Image()
        img.onload = () => {
            const s = Math.min(
                window.innerWidth / img.naturalWidth,
                window.innerHeight / img.naturalHeight,
            )
            setScale(s)
            setOffset({
                x: (window.innerWidth - img.naturalWidth * s) / 2,
                y: (window.innerHeight - img.naturalHeight * s) / 2,
            })
        }
        img.src = mapUrl
    }, [mapUrl])

    // Wheel zoom — must be non-passive to preventDefault
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const handler = (e: WheelEvent) => {
            e.preventDefault()
            const cur = scaleRef.current
            const off = offsetRef.current
            const delta = e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED
            const next = Math.min(Math.max(cur + delta, MIN_SCALE), MAX_SCALE)
            setScale(next)
            setOffset({
                x: e.clientX - ((e.clientX - off.x) / cur) * next,
                y: e.clientY - ((e.clientY - off.y) / cur) * next,
            })
        }
        el.addEventListener('wheel', handler, { passive: false })
        return () => el.removeEventListener('wheel', handler)
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return
        setIsDragging(true)
        dragStartRef.current = {
            x: e.clientX - offsetRef.current.x,
            y: e.clientY - offsetRef.current.y,
        }
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return
        setOffset({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        })
    }, [isDragging])

    const handleMouseUp = useCallback(() => setIsDragging(false), [])

    return (
        <div
            ref={containerRef}
            className="w-screen h-screen bg-black overflow-hidden relative select-none"
            style={{ cursor: mapUrl ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={e => e.preventDefault()}
        >
            {mapUrl ? (
                <div
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        position: 'absolute',
                    }}
                >
                    <img
                        src={mapUrl}
                        alt=""
                        className="max-w-none block"
                        draggable={false}
                        style={rotation === 90 ? { transform: 'rotate(90deg)', transformOrigin: 'center center' } : undefined}
                    />

                    {fogZones !== null && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <mask id="player-fog-mask">
                                    <rect width="100%" height="100%" fill="white" />
                                    {fogZones.map(zone => (
                                        <rect
                                            key={zone.id}
                                            x={`${zone.x}%`}
                                            y={`${zone.y}%`}
                                            width={`${zone.w}%`}
                                            height={`${zone.h}%`}
                                            fill="black"
                                        />
                                    ))}
                                </mask>
                            </defs>
                            <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#player-fog-mask)" />
                        </svg>
                    )}
                </div>
            ) : (
                <div className="w-full h-full bg-linear-to-br from-arcane-secondary to-ui-bg" />
            )}

            {initiative && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-5 py-2.5 bg-black/70 backdrop-blur-sm rounded-2xl pointer-events-none flex items-center gap-3">
                    <span className="text-danger-gold font-display font-bold text-sm uppercase tracking-widest shrink-0">Round {initiative.round}</span>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                        {initiative.entries.map((e, i) => (
                            <span
                                key={i}
                                className={`text-sm px-2.5 py-1 rounded-lg whitespace-nowrap ${e.active ? 'bg-danger-primary text-white font-bold' : 'text-white/70'}`}
                            >
                                {e.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {overlay && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                    <img
                        src={overlay.dataUrl}
                        alt={overlay.name}
                        className="max-w-[40vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
                    />
                </div>
            )}

        </div>
    )
}

export default PlayerScreen
