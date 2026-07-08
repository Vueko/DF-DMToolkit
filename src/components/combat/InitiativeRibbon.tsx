import type { EncounterCombat, EnemyInstance, PartyMember } from '../../types'
import { usePartyStore } from '../../store/partyStore'
import { applyPcHp } from '../../utils/combat'
import { ConditionBadge } from '../conditions/ConditionBadge'
import { ConditionPicker } from '../conditions/ConditionPicker'
import { HpTracker } from './HpTracker'
import { DeathSaveTracker } from './DeathSaveTracker'
import { Button } from '../ui'
import { useT } from '../../i18n'

interface InitiativeRibbonProps {
    combat: EncounterCombat
    members: PartyMember[]
    instancesById: Map<string, EnemyInstance>
    campaignId: string
    onPrev: () => void
    onNext: () => void
    onEnd: () => void
}

// Cinta horizontal con la ronda y el orden de iniciativa; los PCs gestionan
// sus condiciones desde el propio chip.
export function InitiativeRibbon({ combat, members, instancesById, campaignId, onPrev, onNext, onEnd }: InitiativeRibbonProps) {
    const t = useT()
    const { updateMember } = usePartyStore()
    const memberById = new Map(members.map((m) => [m.id, m]))

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-ui-text font-display font-bold px-3 py-1 bg-ui-surface2 border border-ui-surface2 rounded-lg">
                    {t('initiative.round', { round: combat.round })}
                </span>
                <Button variant="secondary" size="sm" onClick={onPrev}>{t('initiative.prev')}</Button>
                <Button variant="primary" size="sm" onClick={onNext}>{t('initiative.next')}</Button>
                <Button variant="destructive" size="sm" onClick={onEnd}>{t('initiative.end')}</Button>
            </div>

            <div className="flex items-stretch gap-1.5 overflow-x-auto pb-1">
                {combat.combatants.map((c, index) => {
                    const isActive = index === combat.turnIndex
                    const member = c.kind === 'pc' ? memberById.get(c.refId) : undefined
                    const instance = c.kind === 'enemy' ? instancesById.get(c.refId) : undefined
                    const name = member?.name || instance?.label || '—'
                    return (
                        <div
                            key={c.id}
                            className={`shrink-0 rounded-lg border px-3 py-2 flex flex-col gap-1.5 min-w-36 max-w-72 ${
                                isActive
                                    ? 'bg-arcane-secondary/20 border-arcane-light/60'
                                    : 'bg-ui-surface border-ui-surface2/60'
                            } ${c.hidden ? 'opacity-60' : ''}`}
                        >
                            {/* Fila 1: iniciativa + nombre (+ AC/PP a la derecha) */}
                            <div className="flex items-center gap-2">
                                <span className="text-base font-display font-bold text-ui-text tabular-nums">{c.initiative}</span>
                                <span className={`text-sm truncate ${isActive ? 'text-ui-text font-semibold' : 'text-ui-muted'}`}>
                                    {name}{c.hidden ? ' 👁' : ''}
                                </span>
                                {member && (member.ac !== undefined || member.passivePerception !== undefined) && (
                                    <span className="ml-auto text-[10px] text-ui-muted shrink-0">
                                        {member.ac !== undefined ? `AC ${member.ac}` : ''}{member.ac !== undefined && member.passivePerception !== undefined ? ' · ' : ''}{member.passivePerception !== undefined ? `PP ${member.passivePerception}` : ''}
                                    </span>
                                )}
                            </div>
                            {member && (
                                <>
                                    {/* Fila 2: vida */}
                                    {member.maxHp !== undefined && member.maxHp > 0 && (
                                        <>
                                            <HpTracker
                                                current={member.hpCurrent ?? member.maxHp}
                                                max={member.maxHp}
                                                temp={member.tempHp ?? 0}
                                                onApply={(delta) => updateMember(campaignId, member.id, applyPcHp(member, delta))}
                                                onSetTemp={(tempHp) => updateMember(campaignId, member.id, { tempHp })}
                                                compact
                                            />
                                            {(member.hpCurrent ?? member.maxHp) === 0 && (
                                                <DeathSaveTracker
                                                    deathSaves={member.deathSaves ?? { successes: 0, failures: 0 }}
                                                    onChange={(deathSaves) => updateMember(campaignId, member.id, { deathSaves })}
                                                />
                                            )}
                                        </>
                                    )}
                                    {/* Fila 3: condiciones, separadas por un divisor */}
                                    <div className="flex items-center gap-1 flex-wrap pt-1.5 border-t border-ui-surface2/60">
                                        {member.conditions.map((cond, i) => (
                                            <ConditionBadge
                                                key={`${cond.conditionId}-${i}`}
                                                condition={cond}
                                                onUpdate={(u) => updateMember(campaignId, member.id, { conditions: member.conditions.map((x, j) => (j === i ? { ...x, ...u } : x)) })}
                                                onRemove={() => updateMember(campaignId, member.id, { conditions: member.conditions.filter((_, j) => j !== i) })}
                                            />
                                        ))}
                                        <ConditionPicker applied={member.conditions} onAdd={(cond) => updateMember(campaignId, member.id, { conditions: [...member.conditions, cond] })} />
                                    </div>
                                </>
                            )}
                            {instance && instance.conditions.length > 0 && (
                                <span className="text-[9px] text-arcane-light font-bold">
                                    {instance.conditions.length} ⚠
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
