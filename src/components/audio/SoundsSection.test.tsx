import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SoundboardProvider } from '../../context/SoundboardContext'
import { useSoundboardStore } from '../../store/soundboardStore'
import { BUILTIN_SOUNDS } from '../../audio/builtinSounds'
import SoundsSection from './SoundsSection'
import type { Sound, SoundCategory } from '../../types'

// `useSoundboardStore` usa el middleware `persist`, cuyo `getInitialState()` queda
// congelado para siempre en el estado inicial de creación del store (ver
// node_modules/zustand/esm/middleware.mjs: `api.getInitialState = () => configResult`,
// donde `configResult` es el objeto sincrónico devuelto por el creator ANTES de
// cualquier hidratación). React usa exactamente ese valor como "server snapshot" de
// `useSyncExternalStore` dentro de `react-dom/server` (renderToStaticMarkup /
// renderToString), sin importar si `window`/`document` existen o no: se confirmó con
// un repro aislado (store zustand plano + setState + renderToStaticMarkup) que el
// render SIEMPRE muestra el estado inicial de creación, nunca el estado tras un
// `setState()` posterior. Por eso, en este entorno de test (sin jsdom, `renderToStaticMarkup`
// para todo), ningún `useSoundboardStore.setState(...)` hecho antes de renderizar puede
// reflejarse en un componente que lea el store vía su hook real — aunque en la app real
// (que monta con `createRoot`, no SSR) la reactividad funciona sin problema.
//
// Se mockea el store con una implementación mínima y equivalente (mismas acciones,
// mismo shape de estado) pero SIN ese snapshot de servidor congelado, para poder
// testear cómo `SoundsSection` renderiza según distintos estados. No se toca ningún
// archivo de producción (soundboardStore.ts y useAllSounds.ts, que también lo consume,
// quedan intactos); el mock vive solo en este archivo de test.
vi.mock('../../store/soundboardStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../store/soundboardStore')>()

    // `SoundboardState` no se exporta desde soundboardStore.ts (es una interface interna),
    // así que la reconstruimos por inferencia desde el propio store real vía `getState()`.
    // Esto ancla el mock al shape real: si el store real cambia una firma de acción o un
    // campo de estado, `fullState() satisfies RealSoundboardState` más abajo dejará de
    // compilar en vez de quedar silenciosamente desincronizado.
    type RealSoundboardState = ReturnType<typeof actual.useSoundboardStore.getState>

    interface MockState {
        categories: SoundCategory[]
        sounds: Sound[]
        activeAmbientIds: string[]
        hiddenBuiltinIds: string[]
    }

    let state: MockState = { categories: [], sounds: [], activeAmbientIds: [], hiddenBuiltinIds: [] }
    const listeners = new Set<() => void>()
    const notify = () => listeners.forEach((l) => l())
    let seq = 0

    const actions = {
        addCategory: (name: string) => {
            state = { ...state, categories: [...state.categories, { id: `c${++seq}`, name, order: state.categories.length }] }
            notify()
        },
        removeCategory: (id: string) => {
            state = {
                ...state,
                categories: state.categories.filter((c) => c.id !== id),
                sounds: state.sounds.filter((s) => s.categoryId !== id),
            }
            notify()
        },
        renameCategory: (id: string, name: string) => {
            state = { ...state, categories: state.categories.map((c) => (c.id === id ? { ...c, name } : c)) }
            notify()
        },
        addSound: (sound: Sound) => {
            state = { ...state, sounds: [...state.sounds, sound] }
            notify()
        },
        removeSound: (id: string) => {
            state = {
                ...state,
                sounds: state.sounds.filter((s) => s.id !== id),
                activeAmbientIds: state.activeAmbientIds.filter((a) => a !== id),
            }
            notify()
        },
        updateSound: (id: string, updates: Partial<Sound>) => {
            state = { ...state, sounds: state.sounds.map((s) => (s.id === id ? { ...s, ...updates } : s)) }
            notify()
        },
        setActiveAmbientIds: (ids: string[]) => {
            state = { ...state, activeAmbientIds: ids }
            notify()
        },
        hideBuiltin: (id: string) => {
            state = {
                ...state,
                hiddenBuiltinIds: state.hiddenBuiltinIds.includes(id) ? state.hiddenBuiltinIds : [...state.hiddenBuiltinIds, id],
                activeAmbientIds: state.activeAmbientIds.filter((a) => a !== id),
            }
            notify()
        },
        unhideBuiltin: (id: string) => {
            state = { ...state, hiddenBuiltinIds: state.hiddenBuiltinIds.filter((h) => h !== id) }
            notify()
        },
    }

    const fullState = () => ({ ...state, ...actions }) satisfies RealSoundboardState
    type FullState = ReturnType<typeof fullState>

    function useSoundboardStore<T = FullState>(selector?: (s: FullState) => T): T {
        return (selector ? selector(fullState()) : fullState()) as T
    }
    useSoundboardStore.getState = fullState
    useSoundboardStore.setState = (partial: Partial<MockState>) => {
        state = { ...state, ...partial }
        notify()
    }
    useSoundboardStore.subscribe = (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }

    return { ...actual, useSoundboardStore }
})

const render = () => renderToStaticMarkup(<SoundboardProvider><SoundsSection /></SoundboardProvider>)

const userSound = (id: string, type: Sound['type'], categoryId: string): Sound =>
    ({ id, name: `User-${id}`, storedId: id, type, categoryId })

beforeEach(() => useSoundboardStore.setState({ categories: [], sounds: [], activeAmbientIds: [], hiddenBuiltinIds: [] }))

describe('SoundsSection', () => {
    it('muestra los builtins agrupados en Starter dentro de su zona por tipo', () => {
        const html = render()
        const ambient = BUILTIN_SOUNDS.find((b) => b.type === 'ambient')!
        const oneshot = BUILTIN_SOUNDS.find((b) => b.type === 'oneshot')!
        expect(html).toContain('Starter')
        // nombres EN por defecto (navigator.language stubbed en-US)
        expect(html.indexOf(ambient.id) === -1).toBe(true) // ids no se pintan
        expect(html).toContain('Ambience')
        expect(html).toContain('One-shots')
        void oneshot
    })
    it('muestra sonidos del usuario bajo su categoría', () => {
        useSoundboardStore.setState({
            categories: [{ id: 'c1', name: 'MiCat', order: 0 }],
            sounds: [userSound('u1', 'oneshot', 'c1')],
        })
        const html = render()
        expect(html).toContain('MiCat')
        expect(html).toContain('User-u1')
    })
    it('una categoría vacía se muestra igual, con placeholder para agregar sonidos', () => {
        useSoundboardStore.setState({ categories: [{ id: 'c1', name: 'CatVacia', order: 0 }] })
        const html = render()
        expect(html).toContain('CatVacia')
        expect(html).toContain('No sounds yet')
    })
    it('un builtin oculto no se renderiza y aparece el botón de mostrar ocultos', () => {
        useSoundboardStore.setState({ hiddenBuiltinIds: [BUILTIN_SOUNDS[0].id] })
        const html = render()
        expect(html).toContain('(1)')
    })
})
