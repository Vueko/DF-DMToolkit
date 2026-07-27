// src/components/dice/DiceTray.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { d20RollResult, parseNotation, roll, type RollMode, type RollResult, type RollSpec } from '../../dice/roll'
import DiceTray from './DiceTray'

// Mock diceStore: Zustand stores have frozen server snapshots with renderToStaticMarkup (even plain
// stores per SoundsSection.test.tsx). Mock anchors to real store shape via type-driven satisfies,
// so any future store refactoring (action signature changes, state shape drift) fails compilation.
vi.mock('../../store/diceStore', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../store/diceStore')>()

    // Anchor mock to real store: if diceStore's shape changes, this compiles to error.
    type RealDiceState = ReturnType<typeof actual.useDiceStore.getState>

    interface MockState {
        history: RollResult[]
        trayOpen: boolean
        mode: RollMode
    }

    let state: MockState = {
        history: [],
        trayOpen: false,
        mode: 'normal',
    }

    const listeners = new Set<() => void>()
    const notify = () => listeners.forEach((l) => l())

    const actions = {
        rollSpec: (spec: RollSpec, label?: string): RollResult => {
            const result = { ...roll(spec), label }
            actions.logRoll(result)
            return result
        },
        rollNotation: (notation: string, opts: { label?: string; mode?: RollMode } = {}): RollResult | null => {
            const spec = parseNotation(notation)
            if (!spec) return null
            return actions.rollSpec({ ...spec, mode: opts.mode ?? state.mode }, opts.label)
        },
        logRoll: (result: RollResult): void => {
            state = { ...state, history: [result, ...state.history].slice(0, 50) }
            notify()
        },
        clearHistory: (): void => {
            state = { ...state, history: [] }
            notify()
        },
        setTrayOpen: (open: boolean): void => {
            state = { ...state, trayOpen: open, mode: open ? state.mode : 'normal' }
            notify()
        },
        setMode: (mode: RollMode): void => {
            state = { ...state, mode }
            notify()
        },
    }

    const fullState = () => ({ ...state, ...actions }) satisfies RealDiceState
    type FullState = ReturnType<typeof fullState>

    function useDiceStore<T = FullState>(selector?: (s: FullState) => T): T {
        return (selector ? selector(fullState()) : fullState()) as T
    }

    useDiceStore.getState = fullState
    useDiceStore.setState = (partial: Partial<MockState>) => {
        state = { ...state, ...partial }
        notify()
    }
    useDiceStore.subscribe = (listener: () => void) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }

    return { ...actual, useDiceStore }
})

const { useDiceStore } = await import('../../store/diceStore')

beforeEach(() => useDiceStore.setState({ history: [], trayOpen: false, mode: 'normal' }))

describe('DiceTray', () => {
    it('cerrada renderiza solo el botón flotante con svg', () => {
        const html = renderToStaticMarkup(<DiceTray />)
        expect(html).toContain('<svg')
        expect(html).not.toContain('d100')
    })
    it('cerrada muestra el total de la última tirada junto al botón', () => {
        useDiceStore.setState({ history: [d20RollResult(11, 3, 'x')] })
        const html = renderToStaticMarkup(<DiceTray />)
        expect(html).toContain('14')
    })
    it('abierta muestra dados rápidos, modos e historial', () => {
        useDiceStore.setState({ trayOpen: true, history: [d20RollResult(15, 2, 'Initiative · Wolf')] })
        const html = renderToStaticMarkup(<DiceTray />)
        expect(html).toContain('d100')
        expect(html).toContain('Advantage')
        expect(html).toContain('Initiative · Wolf')
        expect(html).toContain('17')
    })
    it('nat 20 lleva la clase de crítico', () => {
        useDiceStore.setState({ trayOpen: true, history: [d20RollResult(20, 5, 'x')] })
        expect(renderToStaticMarkup(<DiceTray />)).toContain('text-danger-gold')
    })
})
