import { Link } from 'react-router-dom'
import { useCampaignStore } from '../../store/campaignStore'
import { usePartyStore, partyOf } from '../../store/partyStore'
import { useSettingsStore } from '../../store/settingsStore'
import { buildStartSteps, type StartStep } from './startSteps'
import { useT } from '../../i18n'

// Parte presentacional, testeable sin stores (SSR usa el snapshot inicial de zustand).
export function GetStartedContent({ steps, optional }: { steps: StartStep[]; optional: StartStep[] }) {
    const t = useT()
    const currentIdx = steps.findIndex((s) => !s.done)

    const row = (step: StartStep, idx: number) => {
        const isCurrent = idx === currentIdx
        const isPending = !step.done && !isCurrent
        return (
            <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                    isCurrent ? 'bg-ui-bg/60 border border-arcane-light/50' : 'bg-ui-bg/40'
                }`}
            >
                <span className={`text-sm shrink-0 tabular-nums ${step.done ? 'text-green-600' : isCurrent ? 'text-arcane-light font-bold' : 'text-ui-muted'}`}>
                    {step.done ? '✓' : idx + 1}
                </span>
                <span className={`text-sm flex-1 ${step.done ? 'text-ui-muted line-through' : isPending ? 'text-ui-muted' : 'text-ui-text font-medium'}`}>
                    {t(step.label)}
                </span>
                {isCurrent && (
                    <Link
                        to={step.link}
                        className="shrink-0 bg-danger-yellow text-ui-canvas hover:bg-danger-secondary px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                        {t('start.go')}
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="bg-ui-surface rounded-2xl border border-ui-surface2 p-6 flex flex-col gap-4 max-w-2xl">
            <div>
                <h2 className="text-ui-text font-display font-semibold text-lg">{t('start.title')}</h2>
                <p className="text-ui-muted text-sm">{t('start.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-2">
                {steps.map(row)}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-ui-surface2/60">
                {optional.map((step) => (
                    <div key={step.id} className="flex items-center gap-3 px-4 py-2">
                        <span className={`text-sm shrink-0 ${step.done ? 'text-green-600' : 'text-ui-muted'}`}>{step.done ? '✓' : '○'}</span>
                        <span className={`text-xs flex-1 ${step.done ? 'text-ui-muted line-through' : 'text-ui-muted'}`}>{t(step.label)}</span>
                        {!step.done && (
                            <Link to={step.link} className="text-arcane-light hover:text-arcane-secondary text-xs transition-colors shrink-0">
                                {t(step.linkLabel)} →
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Guía persistente del flujo de juego; sustituye a los widgets cuando no hay sesión activa.
function GetStartedPanel() {
    const { campaigns, currentCampaignId, currentSessionId } = useCampaignStore()
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const members = usePartyStore((s) => partyOf(s, currentCampaignId))
    const vaultPath = useSettingsStore((s) => s.vaultPath)
    const { steps, optional } = buildStartSteps(campaign, members, vaultPath, currentSessionId)
    return <GetStartedContent steps={steps} optional={optional} />
}

export default GetStartedPanel
