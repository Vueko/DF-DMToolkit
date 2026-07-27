import { useRef, useState } from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { useMusicStore } from '../../store/musicStore'
import { saveTrackFile, deleteTrackFile } from '../../utils/musicDb'
import { generateId } from '../../utils/generateId'
import type { Track } from '../../types'
import { EmptyState } from '../ui'
import { useT } from '../../i18n'
import { RequirementNotice } from '../ui/RequirementNotice'

type Mood = 'calm' | 'tense' | 'epic' | 'mystery' | 'ambient'

const MOOD_LABELS: Record<Mood, string> = {
    calm: 'music.moodCalm',
    tense: 'music.moodTense',
    epic: 'music.moodEpic',
    mystery: 'music.moodMystery',
    ambient: 'music.moodAmbient',
}

function formatDuration(secs?: number): string {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

const MOOD_COLORS: Record<string, string> = {
    calm: 'bg-danger-secondary/20 text-danger-secondary border-danger-secondary/30',
    tense: 'bg-danger-primary/20 text-danger-primary border-danger-primary/30',
    epic: 'bg-danger-yellow/20 text-danger-yellow border-danger-yellow/30',
    mystery: 'bg-arcane-light/20 text-arcane-light border-arcane-light/30',
    ambient: 'bg-ui-muted/20 text-ui-muted border-ui-muted/30',
}

const MOOD_OPTIONS: Mood[] = ['calm', 'tense', 'epic', 'mystery', 'ambient']

function MusicSection() {
    const t = useT()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [newPlaylistName, setNewPlaylistName] = useState('')
    const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)

    const {
        campaigns, currentCampaignId,
        addPlaylist, removePlaylist, renamePlaylist,
        addTrackToPlaylist, removeTrackFromPlaylist, updateTrackInPlaylist,
    } = useCampaignStore()

    const { currentTrackIndex, isPlaying, setCurrentTrackIndex, setIsPlaying, activePlaylistId, setActivePlaylistId } = useMusicStore()

    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const playlists = campaign?.playlists ?? []
    const viewedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? playlists[0] ?? null
    const tracks = viewedPlaylist?.tracks ?? []
    const activePlaylist = playlists.find((p) => p.id === activePlaylistId) ?? null

    if (!currentCampaignId || !campaign) {
        return <RequirementNotice title={t('music.noCampaignSelected')} hint={t('music.noCampaignHint')} link="/campaigns" linkLabel={t('nav.campaigns')} />
    }

    const handleCreatePlaylist = () => {
        if (!newPlaylistName.trim()) return
        const playlist = { id: crypto.randomUUID(), name: newPlaylistName.trim(), tracks: [] }
        addPlaylist(currentCampaignId, playlist)
        setSelectedPlaylistId(playlist.id)
        setNewPlaylistName('')
    }

    const handleRenameConfirm = (playlistId: string) => {
        if (editingName.trim()) renamePlaylist(currentCampaignId, playlistId, editingName.trim())
        setEditingPlaylistId(null)
        setEditingName('')
    }

    const handleRemovePlaylist = async (playlistId: string) => {
        const pl = playlists.find((p) => p.id === playlistId)
        if (pl) {
            for (const trk of pl.tracks) await deleteTrackFile(trk.id)
        }
        if (activePlaylistId === playlistId) setActivePlaylistId(null)
        if (selectedPlaylistId === playlistId) setSelectedPlaylistId(playlists.find((p) => p.id !== playlistId)?.id ?? null)
        removePlaylist(currentCampaignId, playlistId)
    }

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!viewedPlaylist) return
        const ALLOWED_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/x-m4a', 'audio/mp4', 'audio/webm']
        const files = Array.from(e.target.files ?? []).filter((f) => ALLOWED_TYPES.includes(f.type))
        for (const file of files) {
            const id = generateId()
            const duration = await getAudioDuration(file)
            const track: Track = { id, storedId: id, title: file.name.replace(/\.[^/.]+$/, ''), artist: 'Unknown', duration }
            await saveTrackFile(id, file)
            addTrackToPlaylist(currentCampaignId, viewedPlaylist.id, track)
        }
        e.target.value = ''
    }

    const getAudioDuration = (file: File): Promise<number> =>
        new Promise((resolve) => {
            const url = URL.createObjectURL(file)
            const audio = new Audio(url)
            const cleanup = () => URL.revokeObjectURL(url)
            // Safari may not fire canplay — resolve after 5s max
            const timeout = setTimeout(() => { cleanup(); resolve(0) }, 5000)
            audio.addEventListener('loadedmetadata', () => { clearTimeout(timeout); cleanup(); resolve(audio.duration) })
            audio.addEventListener('error', () => { clearTimeout(timeout); cleanup(); resolve(0) })
        })

    const handleRemoveTrack = async (trackId: string, index: number) => {
        if (!viewedPlaylist) return
        await deleteTrackFile(trackId)
        removeTrackFromPlaylist(currentCampaignId, viewedPlaylist.id, trackId)
        if (activePlaylistId === viewedPlaylist.id && currentTrackIndex === index) {
            setIsPlaying(false)
            setCurrentTrackIndex(0)
        }
    }

    const handlePlayTrack = (index: number) => {
        if (!viewedPlaylist) return
        if (activePlaylistId !== viewedPlaylist.id) {
            setActivePlaylistId(viewedPlaylist.id)
        }
        if (currentTrackIndex === index && activePlaylistId === viewedPlaylist.id) {
            useMusicStore.getState().togglePlay()
        } else {
            setCurrentTrackIndex(index)
            setIsPlaying(true)
        }
    }

    const isTrackActive = (index: number) =>
        activePlaylistId === viewedPlaylist?.id && currentTrackIndex === index

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <header className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-ui-surface2">
                <p className="text-sm text-ui-muted">{campaign.name}</p>
                {activePlaylist && (
                    <div className="flex items-center gap-2 text-xs text-ui-muted bg-ui-surface border border-ui-surface2 px-3 py-1.5 rounded-lg">
                        <span className="text-danger-primary">▶</span>
                        <span>{t('music.nowPlayingFrom')} <strong className="text-ui-text">{activePlaylist.name}</strong></span>
                    </div>
                )}
            </header>

            <div className="flex flex-1 overflow-hidden">
                <aside className="w-64 shrink-0 border-r border-ui-surface2 flex flex-col overflow-hidden bg-ui-bg">
                    <div className="p-4 border-b border-ui-surface2">
                        <p className="text-xs text-ui-muted uppercase tracking-wider font-bold mb-3">{t('music.playlists')}</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newPlaylistName}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                                placeholder={t('music.newPlaylistPlaceholder')}
                                className="flex-1 bg-ui-surface text-ui-text text-xs px-2 py-1.5 rounded-lg outline-none border border-ui-surface2 focus:border-danger-primary transition-colors"
                            />
                            <button
                                onClick={handleCreatePlaylist}
                                className="text-xs bg-danger-primary hover:bg-danger-secondary text-white px-2 py-1.5 rounded-lg transition-colors font-bold"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                        {playlists.length === 0 && (
                            <EmptyState size="sm" title={t('music.noPlaylists')} description={t('music.createOneAbove')} />
                        )}
                        {playlists.map((pl) => {
                            const isViewed = pl.id === (viewedPlaylist?.id ?? playlists[0]?.id)
                            const isActive = pl.id === activePlaylistId
                            return (
                                <div
                                    key={pl.id}
                                    onClick={() => setSelectedPlaylistId(pl.id)}
                                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                        isViewed ? 'bg-ui-surface border border-ui-surface2' : 'hover:bg-ui-surface/60 border border-transparent'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-0.5 ${isActive ? 'bg-danger-primary' : 'bg-ui-surface2'}`} />
                                    {editingPlaylistId === pl.id ? (
                                        <input
                                            autoFocus
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={() => handleRenameConfirm(pl.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm(pl.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 bg-transparent text-ui-text text-sm outline-none border-b border-danger-primary"
                                        />
                                    ) : (
                                        <span className={`flex-1 text-sm truncate ${isViewed ? 'text-ui-text font-medium' : 'text-ui-muted'}`}>
                                            {pl.name}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-ui-muted shrink-0">{pl.tracks.length}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingPlaylistId(pl.id); setEditingName(pl.name) }}
                                            className="text-ui-muted hover:text-ui-text text-[10px] transition-colors"
                                            title={t('music.rename')}
                                        >✎</button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemovePlaylist(pl.id) }}
                                            className="text-ui-muted hover:text-red-500 text-[10px] transition-colors"
                                            title={t('music.delete')}
                                        >✕</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </aside>

                <main className="flex-1 flex flex-col overflow-hidden">
                    {!viewedPlaylist ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-ui-muted p-8">
                            <div className="w-14 h-14 rounded-full bg-linear-to-br from-arcane-secondary to-arcane-light flex items-center justify-center text-ui-canvas/70 text-2xl select-none">
                                ♩
                            </div>
                            <p className="font-medium">{t('music.createPlaylistCta')}</p>
                            <p className="text-xs">{t('music.createPlaylistHint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between px-6 py-3 border-b border-ui-surface2 shrink-0">
                                <div>
                                    <h2 className="text-sm font-bold text-ui-text">{viewedPlaylist.name}</h2>
                                    <p className="text-xs text-ui-muted">{t(tracks.length === 1 ? 'music.trackCountOne' : 'music.trackCountOther', { count: tracks.length })}</p>
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-xs bg-ui-surface hover:bg-ui-surface2 text-ui-text border border-ui-surface2 px-3 py-1.5 rounded-lg transition-colors font-medium"
                                >
                                    {t('music.addTracks')}
                                </button>
                                <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileImport} />
                            </div>

                            <div className="flex-1 overflow-y-auto p-4">
                                {tracks.length === 0 ? (
                                    <div
                                        className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-ui-surface2 rounded-xl gap-3 cursor-pointer hover:border-danger-primary transition-colors group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-ui-surface2 group-hover:bg-arcane-light/20 flex items-center justify-center text-xl text-ui-muted transition-colors select-none">
                                            ♩
                                        </div>
                                        <p className="text-ui-muted group-hover:text-ui-text text-sm transition-colors">{t('music.clickToImport')}</p>
                                        <p className="text-ui-muted text-xs">{t('music.formatsSupported')}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {tracks.map((track, index) => {
                                            const active = isTrackActive(index)
                                            return (
                                                <div
                                                    key={track.id}
                                                    onClick={() => handlePlayTrack(index)}
                                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${
                                                        active
                                                            ? 'bg-danger-primary/15 border border-danger-primary/30'
                                                            : 'hover:bg-ui-surface/50 border border-transparent'
                                                    }`}
                                                >
                                                    <div className="w-7 flex items-center justify-center shrink-0">
                                                        {active && isPlaying ? (
                                                            <span className="text-danger-primary text-sm font-bold">‖</span>
                                                        ) : active ? (
                                                            <span className="text-danger-primary">▶</span>
                                                        ) : (
                                                            <>
                                                                <span className="text-xs text-ui-muted group-hover:hidden">{index + 1}</span>
                                                                <span className="text-sm hidden group-hover:block text-ui-text">▶</span>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${active ? 'text-danger-primary' : 'text-ui-text'}`}>
                                                            {track.title}
                                                        </p>
                                                        <p className="text-ui-muted text-xs truncate">{track.artist}</p>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        {MOOD_OPTIONS.map((m) => (
                                                            <button
                                                                key={m}
                                                                onClick={() => updateTrackInPlaylist(
                                                                    currentCampaignId,
                                                                    viewedPlaylist!.id,
                                                                    track.id,
                                                                    { mood: track.mood === m ? undefined : m }
                                                                )}
                                                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border transition-colors ${
                                                                    track.mood === m
                                                                        ? MOOD_COLORS[m]
                                                                        : 'border-transparent text-ui-muted/50 hover:text-ui-muted'
                                                                } opacity-0 group-hover:opacity-100`}
                                                                title={t(MOOD_LABELS[m])}
                                                            >
                                                                {m[0].toUpperCase()}
                                                            </button>
                                                        ))}
                                                        {track.mood && (
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ml-1 ${MOOD_COLORS[track.mood] ?? ''}`}>
                                                                {t(MOOD_LABELS[track.mood as Mood])}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <span className="text-ui-muted text-xs w-9 text-right shrink-0">
                                                        {formatDuration(track.duration)}
                                                    </span>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id, index) }}
                                                        className="text-ui-muted hover:text-red-500 transition-colors text-xs opacity-0 group-hover:opacity-100 shrink-0"
                                                        title={t('music.remove')}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}

export default MusicSection
