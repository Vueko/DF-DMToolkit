import { describe, it, expect, beforeEach } from 'vitest'
import { useMusicStore } from './musicStore'

beforeEach(() => useMusicStore.setState({
    currentTrackIndex: 0, isPlaying: false, volume: 0.75, loop: false, shuffle: false, activePlaylistId: null,
}))

describe('musicStore', () => {
    it('togglePlay and setVolume', () => {
        useMusicStore.getState().togglePlay()
        expect(useMusicStore.getState().isPlaying).toBe(true)
        useMusicStore.getState().setVolume(0.4)
        expect(useMusicStore.getState().volume).toBe(0.4)
    })
    it('next and prev wrap around (no shuffle)', () => {
        useMusicStore.setState({ currentTrackIndex: 2 })
        useMusicStore.getState().next(3)
        expect(useMusicStore.getState().currentTrackIndex).toBe(0)
        useMusicStore.getState().prev(3)
        expect(useMusicStore.getState().currentTrackIndex).toBe(2)
    })
    it('next is a no-op on an empty playlist', () => {
        useMusicStore.setState({ currentTrackIndex: 1 })
        useMusicStore.getState().next(0)
        expect(useMusicStore.getState().currentTrackIndex).toBe(1)
    })
    it('setActivePlaylistId resets the track index', () => {
        useMusicStore.setState({ currentTrackIndex: 5 })
        useMusicStore.getState().setActivePlaylistId('p1')
        expect(useMusicStore.getState().activePlaylistId).toBe('p1')
        expect(useMusicStore.getState().currentTrackIndex).toBe(0)
    })
})
