import { useState } from 'react'
import SceneWidget from '../components/dashboard/SceneWidget'
import CombatBoard from '../components/combat/CombatBoard'
import RulesWidget from '../components/dashboard/RulesWidget'
import MoodWidget from '../components/dashboard/MoodWidget'
import PlayerScreenWidget from '../components/dashboard/PlayerScreenWidget'
import PrepChecklistModal from '../components/dashboard/PrepChecklistModal'
import { useCampaignStore } from '../store/campaignStore'
import { useT } from '../i18n'

function DMDashboard() {
    const t = useT()
    const { campaigns, currentCampaignId, currentSessionId } = useCampaignStore()

    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const currentSession = currentCampaign?.sessions.find((s) => s.id === currentSessionId) ?? null

    const hasCampaign = currentCampaign !== null
    const [prepOpen, setPrepOpen] = useState(currentSession === null)

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
                    <button
                        onClick={() => setPrepOpen(true)}
                        className="text-ui-muted hover:text-ui-text bg-ui-surface hover:bg-ui-surface2 border border-ui-surface2 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        {t('dashboard.prep')}
                    </button>
                    <MoodWidget />
                </div>
            </div>

            {/* 3 bandas: combate / escenas+reglas / pantalla de jugador */}
            <div className={`flex flex-col gap-4 ${!hasCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
                <CombatBoard />
                <div className="grid grid-cols-2 gap-4">
                    <SceneWidget />
                    <RulesWidget />
                </div>
                <PlayerScreenWidget />
            </div>

            <PrepChecklistModal
                campaign={currentCampaign}
                open={prepOpen}
                onClose={() => setPrepOpen(false)}
            />
        </div>
    )
}

export default DMDashboard
