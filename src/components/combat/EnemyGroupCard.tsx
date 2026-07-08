import type { Monster, EnemyInstance, Combatant } from '../../types'
import { useCombatStore } from '../../store/combatStore'
import { crLabel } from '../../utils/monster'
import { ConditionBadge } from '../conditions/ConditionBadge'
import { ConditionPicker } from '../conditions/ConditionPicker'
import { HpTracker } from './HpTracker'
import { useT } from '../../i18n'

interface EnemyGroupCardProps {
    encounterId: string
    monster: Monster
    instances: EnemyInstance[]
    combatantById: Map<string, Combatant>
    onOpenStatblock: (m: Monster) => void
}

// Card parchment por tipo de monstruo, estilo EncounterWidget de Daggerheart:
// statblock resumido arriba + una fila de gestión por instancia.
export function EnemyGroupCard({ encounterId, monster, instances, combatantById, onOpenStatblock }: EnemyGroupCardProps) {
    const t = useT()
    const combat = useCombatStore()

    // Sin overflow-hidden en la card: los popovers de condiciones deben poder salir de ella.
    return (
        <div className="bg-card-bg rounded-xl border border-card-border flex-1 min-w-[340px] font-serif">

            {/* Cabecera */}
            <div className="px-4 pt-3 pb-1 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-card-text font-display text-lg font-black uppercase tracking-wide leading-tight truncate">
                        {monster.name}
                    </h3>
                    <p className="text-card-text/65 text-xs italic">
                        CR {crLabel(monster.cr)} · {monster.type}
                    </p>
                </div>
                <button
                    onClick={() => onOpenStatblock(monster)}
                    className="shrink-0 text-card-text/50 hover:text-card-text text-base"
                    title={t('initiative.statblock')}
                >📖</button>
            </div>

            {/* Stats resumidos */}
            <div className="mx-4 my-2 border border-card-border/70 rounded-lg px-3 py-2 flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs text-card-text">
                <span><span className="font-bold">AC</span> {monster.ac}</span>
                <span className="text-card-border/50 select-none">│</span>
                <span><span className="font-bold">HP</span> {monster.hp.average}</span>
                <span className="text-card-border/50 select-none">│</span>
                <span><span className="font-bold">Speed</span> {monster.speed}</span>
                {monster.saves && (
                    <>
                        <span className="text-card-border/50 select-none">│</span>
                        <span><span className="font-bold">Saves</span> {monster.saves}</span>
                    </>
                )}
            </div>

            {/* Resumen de acciones */}
            {monster.actions.length > 0 && (
                <p className="px-4 pb-2.5 text-xs leading-snug text-card-text/80">
                    <span className="font-bold">Actions:</span>{' '}
                    {monster.actions.map((a) => a.name).join(' · ')}
                </p>
            )}

            {/* Filas por instancia */}
            <div className="border-t border-card-border/50 divide-y divide-card-border/30 bg-card-border/5 rounded-b-xl">
                {instances.map((instance) => {
                    const combatant = combatantById.get(instance.instanceId)
                    const dead = instance.hpCurrent === 0 && !(instance.tempHp && instance.tempHp > 0)
                    return (
                        <div key={instance.instanceId} className={`px-3 py-2.5 flex flex-col gap-2 ${dead ? 'opacity-45' : ''} ${combatant?.hidden ? 'opacity-60' : ''}`}>
                            {/* Línea 1: etiqueta + vida */}
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black text-card-text/70 w-20 shrink-0 truncate">{instance.label}</span>
                                <HpTracker
                                    current={instance.hpCurrent}
                                    max={instance.hpMax}
                                    temp={instance.tempHp ?? 0}
                                    onApply={(delta) => combat.damageEnemy(encounterId, instance.instanceId, delta)}
                                    onSetTemp={(tempHp) => combat.updateEnemyInstance(encounterId, instance.instanceId, { tempHp })}
                                    compact
                                />
                            </div>

                            {/* Línea 2: condiciones + legendarios + acciones de fila, separada de la vida */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-card-border/40">
                                {instance.conditions.map((cond, i) => (
                                    <ConditionBadge
                                        key={`${cond.conditionId}-${i}`}
                                        condition={cond}
                                        onUpdate={(u) => combat.updateEnemyInstance(encounterId, instance.instanceId, { conditions: instance.conditions.map((x, j) => (j === i ? { ...x, ...u } : x)) })}
                                        onRemove={() => combat.updateEnemyInstance(encounterId, instance.instanceId, { conditions: instance.conditions.filter((_, j) => j !== i) })}
                                    />
                                ))}
                                <ConditionPicker applied={instance.conditions} onAdd={(cond) => combat.updateEnemyInstance(encounterId, instance.instanceId, { conditions: [...instance.conditions, cond] })} />

                                {instance.legendaryActionsMax !== undefined && (
                                    <button
                                        onClick={() => combat.spendLegendaryAction(encounterId, instance.instanceId)}
                                        className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded border border-danger-gold/60 text-danger-gold bg-danger-gold/10 hover:bg-danger-gold/20"
                                        title={t('initiative.la')}
                                    >LA {instance.legendaryActionsLeft}/{instance.legendaryActionsMax}</button>
                                )}
                                {instance.legendaryResistanceMax !== undefined && (
                                    <button
                                        onClick={() => combat.spendLegendaryResistance(encounterId, instance.instanceId)}
                                        className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded border border-arcane-secondary/60 text-arcane-secondary bg-arcane-secondary/10 hover:bg-arcane-secondary/20"
                                        title={t('initiative.lr')}
                                    >LR {instance.legendaryResistanceLeft}/{instance.legendaryResistanceMax}</button>
                                )}

                                <span className="ml-auto flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => combat.updateEnemyInstance(encounterId, instance.instanceId, { concentrating: !instance.concentrating })}
                                    className={`w-6 h-6 rounded text-xs ${instance.concentrating ? 'bg-arcane-light/30 text-arcane-primary' : 'text-card-text/40 hover:text-card-text'}`}
                                    title={t('initiative.concentration')}
                                >🧠</button>
                                <button
                                    onClick={() => combat.toggleHidden(encounterId, instance.instanceId)}
                                    className={`w-6 h-6 rounded text-xs ${combatant?.hidden ? 'bg-card-border/40 text-card-text' : 'text-card-text/40 hover:text-card-text'}`}
                                    title={t('initiative.hiddenTitle')}
                                >👁</button>
                                <button
                                    onClick={() => combat.removeCombatant(encounterId, instance.instanceId)}
                                    className="w-6 h-6 rounded text-xs text-card-text/40 hover:text-red-600"
                                    title={t('initiative.remove')}
                                >✕</button>
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
