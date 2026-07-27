import { describe, it, expect, beforeEach } from 'vitest'
import { useDiceStore } from './diceStore'
import { d20RollResult } from '../dice/roll'

beforeEach(() => useDiceStore.setState({ history: [], trayOpen: false, mode: 'normal' }))

describe('diceStore', () => {
    it('rollNotation añade al historial (más nuevo primero) con label', () => {
        useDiceStore.getState().rollNotation('2d6+3', { label: 'A' })
        useDiceStore.getState().rollNotation('d20', { label: 'B' })
        const h = useDiceStore.getState().history
        expect(h).toHaveLength(2)
        expect(h[0].label).toBe('B')
        expect(h[1].label).toBe('A')
        expect(h[1].total).toBeGreaterThanOrEqual(5)
        expect(h[1].total).toBeLessThanOrEqual(15)
    })
    it('notación inválida devuelve null y no toca el historial', () => {
        expect(useDiceStore.getState().rollNotation('garbage')).toBeNull()
        expect(useDiceStore.getState().history).toHaveLength(0)
    })
    it('usa el mode del store por defecto y el de opts si viene', () => {
        useDiceStore.getState().setMode('advantage')
        const r1 = useDiceStore.getState().rollNotation('d20')!
        expect(r1.mode).toBe('advantage')
        const r2 = useDiceStore.getState().rollNotation('d20', { mode: 'normal' })!
        expect(r2.mode).toBe('normal')
    })
    it('historial capado a 50', () => {
        for (let i = 0; i < 55; i++) useDiceStore.getState().rollNotation('d6')
        expect(useDiceStore.getState().history).toHaveLength(50)
    })
    it('logRoll inserta un resultado externo', () => {
        useDiceStore.getState().logRoll(d20RollResult(11, 3, 'Initiative · Wolf'))
        expect(useDiceStore.getState().history[0].total).toBe(14)
        expect(useDiceStore.getState().history[0].label).toBe('Initiative · Wolf')
    })
    it('cerrar la bandeja resetea mode a normal; abrirla no', () => {
        useDiceStore.getState().setMode('disadvantage')
        useDiceStore.getState().setTrayOpen(true)
        expect(useDiceStore.getState().mode).toBe('disadvantage')
        useDiceStore.getState().setTrayOpen(false)
        expect(useDiceStore.getState().mode).toBe('normal')
    })
    it('clearHistory vacía', () => {
        useDiceStore.getState().rollNotation('d6')
        useDiceStore.getState().clearHistory()
        expect(useDiceStore.getState().history).toHaveLength(0)
    })
})
