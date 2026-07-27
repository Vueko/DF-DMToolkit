import SceneWidget from '../components/dashboard/SceneWidget'
import CombatBoard from '../components/combat/CombatBoard'
import RulesWidget from '../components/dashboard/RulesWidget'
import MoodWidget from '../components/dashboard/MoodWidget'
import PlayerScreenWidget from '../components/dashboard/PlayerScreenWidget'
import GetStartedPanel from '../components/dashboard/GetStartedPanel'
import { useCampaignStore } from '../store/campaignStore'
import { useT } from '../i18n'

function DMDashboard() {
    const t = useT()
    const { campaigns, currentCampaignId, currentSessionId } = useCampaignStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    return (
        <div className="flex flex-col gap-6">

            {/* Sticky header — always visible while scrolling */}
            <div className="sticky -top-6 z-20 -mx-6 px-6 py-3 bg-ui-canvas/95 backdrop-blur-sm border-b border-ui-surface2/50 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-ui-text font-display text-2xl font-bold">{t('dashboard.title')}</h1>
                    {currentCampaign && currentSession ? (
                        <p className="text-ui-muted text-sm">
                            {t('dashboard.session', {
                                campaignName: currentCampaign.name,
                                number: currentSession.number,
                                sessionName: currentSession.name,
                            })}
                        </p>
                    ) : (
                        <p className="text-ui-muted text-sm">{t('dashboard.noActiveSession')}</p>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <MoodWidget />
                </div>
            </div>

            {/* Sin sesión activa: guía del flujo de juego. Con ella: las 3 bandas de widgets. */}
            {currentSession === null ? (
                <GetStartedPanel />
            ) : (
                <div className="flex flex-col gap-4">
                    <CombatBoard />
                    <div className="grid grid-cols-2 gap-4">
                        <SceneWidget />
                        <RulesWidget />
                    </div>
                    <PlayerScreenWidget />
                </div>
            )}
        </div>
    )
}

export default DMDashboard
