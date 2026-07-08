import { deathSaveStatus } from '../../utils/combat'
import { useT } from '../../i18n'

interface DeathSaveTrackerProps {
    deathSaves: { successes: number; failures: number }
    onChange: (deathSaves: { successes: number; failures: number }) => void
}

// 3 pips de éxito + 3 de fallo; click en el pip N fija ese conteo (click en el
// último lleno lo baja en 1, patrón de rating).
export function DeathSaveTracker({ deathSaves, onChange }: DeathSaveTrackerProps) {
    const t = useT()
    const status = deathSaveStatus(deathSaves.successes, deathSaves.failures)

    const setCount = (kind: 'successes' | 'failures', pip: number) => {
        const current = deathSaves[kind]
        const next = current === pip ? pip - 1 : pip
        onChange({ ...deathSaves, [kind]: next })
    }

    const pips = (kind: 'successes' | 'failures', onColor: string) =>
        [1, 2, 3].map((pip) => (
            <button
                key={pip}
                onClick={() => setCount(kind, pip)}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                    deathSaves[kind] >= pip ? onColor : 'border-ui-surface2 bg-transparent'
                }`}
            />
        ))

    return (
        <div className="flex items-center gap-2 flex-wrap" title={t('combat.deathSaves')}>
            <span className="flex items-center gap-1">{pips('successes', 'bg-green-600 border-green-600')}</span>
            <span className="text-ui-muted text-[10px]">/</span>
            <span className="flex items-center gap-1">{pips('failures', 'bg-red-600 border-red-600')}</span>
            {status === 'stable' && <span className="text-[10px] font-bold text-green-600 uppercase">{t('combat.stable')}</span>}
            {status === 'dead' && <span className="text-[10px] font-bold text-red-600 uppercase">{t('combat.dead')}</span>}
        </div>
    )
}
