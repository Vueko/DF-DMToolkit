import { useEffect, useRef, useState, useCallback } from 'react'
import { useMusicStore } from '../store/musicStore'
import { useCampaignStore } from '../store/campaignStore'
import { getTrackUrl } from '../utils/musicDb'
import { useT } from '../i18n'

function formatTime(secs: number): string {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function MusicBar() {
    const t = useT()
    const audioRef = useRef<HTMLAudioElement>(null)
    const blobUrlRef = useRef<string | null>(null)
    const isLoadingRef = useRef(false)
    const isPlayingRef = useRef(false)

    const [currentTime, setLocalCurrentTime] = useState(0)
    const [duration, setLocalDuration] = useState(0)

    const {
        currentTrackIndex, isPlaying, volume,
        loop, shuffle, activePlaylistId,
        setIsPlaying, setVolume,
        next, prev, toggleLoop, toggleShuffle,
    } = useMusicStore()

    const { campaigns, currentCampaignId } = useCampaignStore()
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const activePlaylist = campaign?.playlists?.find((p) => p.id === activePlaylistId) ?? null
    const playlist = activePlaylist?.tracks ?? []
    const currentTrack = playlist[currentTrackIndex] ?? null

    // Intentionally update ref during render so loadTrack callback always reads the latest isPlaying value
    // eslint-disable-next-line react-hooks/refs
    isPlayingRef.current = isPlaying

    const handleAudioPause = useCallback(() => {
        if (!isLoadingRef.current && isPlayingRef.current) {
            setIsPlaying(false)
        }
    }, [setIsPlaying])

    const loadTrack = useCallback(async (storedId: string) => {
        const audio = audioRef.current
        if (!audio) return

        isLoadingRef.current = true

        audio.onpause = null
        audio.pause()
        audio.onpause = handleAudioPause

        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
        }

        const url = await getTrackUrl(storedId)
        if (!url) { isLoadingRef.current = false; return }

        blobUrlRef.current = url
        audio.src = url

        await new Promise<void>((resolve) => {
            const done = () => {
                clearTimeout(safariTimeout)
                audio.removeEventListener('canplay', done)
                audio.removeEventListener('error', done)
                resolve()
            }
            const safariTimeout = setTimeout(done, 8000)
            audio.addEventListener('canplay', done, { once: true })
            audio.addEventListener('error', done, { once: true })
            audio.load()
        })

        isLoadingRef.current = false

        if (isPlayingRef.current) {
            audio.play().catch(() => setIsPlaying(false))
        }
    }, [handleAudioPause, setIsPlaying])

    useEffect(() => {
        if (!currentTrack) return
        // Intentional sync: reset display time to 0 whenever the active track changes
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalCurrentTime(0)
        setLocalDuration(0)
        loadTrack(currentTrack.storedId)
    }, [currentTrack, loadTrack])

    useEffect(() => {
        if (isLoadingRef.current) return
        const audio = audioRef.current
        if (!audio || !currentTrack) return

        if (isPlaying && audio.paused) {
            audio.play().catch(() => setIsPlaying(false))
        } else if (!isPlaying && !audio.paused) {
            audio.pause()
        }
    }, [isPlaying, currentTrack, setIsPlaying])

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume
    }, [volume])

    useEffect(() => {
        if (audioRef.current) audioRef.current.loop = loop
    }, [loop])

    function handleEnded() {
        if (!loop) next(playlist.length)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const seekTime = Number(e.target.value)
        if (audioRef.current) audioRef.current.currentTime = seekTime
        setLocalCurrentTime(seekTime)
    }

    return (
        <>
            <audio
                ref={audioRef}
                onTimeUpdate={() => setLocalCurrentTime(audioRef.current?.currentTime ?? 0)}
                onDurationChange={() => setLocalDuration(audioRef.current?.duration ?? 0)}
                onEnded={handleEnded}
                onPause={handleAudioPause}
            />

            <div className="h-16 bg-ui-surface border-t border-ui-surface2 flex items-center px-6 shrink-0 gap-4">
                <div className="flex items-center gap-3 w-[28%] min-w-0">
                    <div className="w-9 h-9 rounded bg-linear-to-br from-arcane-secondary to-arcane-light flex items-center justify-center text-ui-canvas/70 text-sm font-bold shrink-0 select-none">
                        ♩
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-ui-text text-sm font-medium truncate">
                            {currentTrack ? currentTrack.title : t('music.noTrackSelected')}
                        </span>
                        <span className="text-ui-muted text-xs truncate">
                            {currentTrack ? currentTrack.artist : '—'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleShuffle}
                            className={`text-xs transition-colors ${shuffle ? 'text-danger-primary' : 'text-ui-muted hover:text-ui-text'}`}
                            title={t('music.shuffle')}
                        >
                            ⇄
                        </button>
                        <button
                            onClick={() => prev(playlist.length)}
                            disabled={playlist.length === 0}
                            className="text-ui-muted hover:text-ui-text transition-colors text-base disabled:opacity-30"
                        >
                            ◀
                        </button>
                        <button
                            onClick={() => useMusicStore.getState().togglePlay()}
                            disabled={playlist.length === 0}
                            className="w-8 h-8 rounded-full bg-danger-primary hover:bg-danger-secondary flex items-center justify-center text-white transition-colors disabled:opacity-30 text-sm"
                        >
                            {isPlaying ? '‖' : '▶'}
                        </button>
                        <button
                            onClick={() => next(playlist.length)}
                            disabled={playlist.length === 0}
                            className="text-ui-muted hover:text-ui-text transition-colors text-base disabled:opacity-30"
                        >
                            ▶
                        </button>
                        <button
                            onClick={toggleLoop}
                            className={`text-xs transition-colors ${loop ? 'text-danger-primary' : 'text-ui-muted hover:text-ui-text'}`}
                            title={t('music.loop')}
                        >
                            ↻
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full max-w-md">
                        <span className="text-ui-muted text-[10px] w-7 text-right shrink-0">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.5}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 accent-danger-primary h-1 cursor-pointer"
                        />
                        <span className="text-ui-muted text-[10px] w-7 shrink-0">{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-[18%] justify-end">
                    <span className="text-ui-muted text-[10px] uppercase tracking-wide shrink-0">{t('music.vol')}</span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-20 accent-danger-primary cursor-pointer"
                    />
                    <span className="text-ui-muted text-[10px] w-7">{Math.round(volume * 100)}%</span>
                </div>
            </div>
        </>
    )
}

export default MusicBar
