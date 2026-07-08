import { describe, it, expect } from 'vitest'
import { buildInitiativePayload } from './playerInitiative'
import type { Combatant, EnemyInstance, PartyMember } from '../types'

const pc = (id: string, init: number, hidden = false): Combatant => ({ id, kind: 'pc', refId: id, initiative: init, hidden })
const en = (id: string, init: number, hidden = false): Combatant => ({ id, kind: 'enemy', refId: id, initiative: init, hidden })
const inst = (id: string, label: string): EnemyInstance => ({ instanceId: id, monsterId: 'm', label, hpCurrent: 1, hpMax: 1, conditions: [] })
const member = (id: string, name: string): PartyMember => ({ id, name, conditions: [] })

describe('buildInitiativePayload', () => {
    it('null cuando el combate no está en marcha', () => {
        expect(buildInitiativePayload({ status: 'idle', round: 0, turnIndex: 0, combatants: [], enemyInstances: [] }, [])).toBeNull()
    })
    it('resuelve nombres, marca el turno activo y oculta como ???', () => {
        const payload = buildInitiativePayload({
            status: 'running', round: 3, turnIndex: 1,
            combatants: [pc('p1', 18), en('e1', 12), en('e2', 5, true)],
            enemyInstances: [inst('e1', 'Goblin 1'), inst('e2', 'Assassin')],
        }, [member('p1', 'Alira')])
        expect(payload).toEqual({
            round: 3,
            entries: [
                { name: 'Alira', active: false, kind: 'pc' },
                { name: 'Goblin 1', active: true, kind: 'enemy' },
                { name: '???', active: false, kind: 'enemy' },
            ],
        })
    })
    it('fallback — para refs desconocidas', () => {
        const payload = buildInitiativePayload({
            status: 'running', round: 1, turnIndex: 0,
            combatants: [pc('missing', 10)], enemyInstances: [],
        }, [])
        expect(payload!.entries[0].name).toBe('—')
    })
})
