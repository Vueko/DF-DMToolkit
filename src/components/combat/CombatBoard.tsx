import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCampaignStore } from '../../store/campaignStore'
import { useCombatStore, combatOf } from '../../store/combatStore'
import { EncounterCombatPanel } from './EncounterCombatPanel'
import { useT } from '../../i18n'

// Zona de combate del Dashboard: tabs de encuentros de la campaña + panel del activo.
function CombatBoard() {
    const t = useT()
    const { campaigns, currentCampaignId, setActiveEncounter } = useCampaignStore()
    const combats = useCombatStore((s) => s.combats)
    const campaign = campaigns.find((c) => c.id === currentCampaignId) ?? null
    const encounters = useMemo(() => campaign?.encounters ?? [], [campaign?.encounters])
    const active = encounters.find((e) => e.id === campaign?.activeEncounterId) ?? encounters[0] ?? null

    if (!currentCampaignId || !campaign) return null

    return (
        <div className="bg-ui-surface rounded-xl border border-ui-surface2/60 p-4 flex flex-col gap-3">
            {encounters.length === 0 ? (
                <p className="text-ui-muted text-sm text-center py-4">
                    {t('combat.empty')}{' '}
                    <Link to="/encounters" className="underline hover:text-ui-text">{t('combat.goBuild')}</Link>
                </p>
            ) : (
                <>
                    <div className="flex gap-1.5 flex-wrap">
                        {encounters.map((e) => {
                            const isActive = e.id === active?.id
                            const running = combatOf({ combats }, e.id).status === 'running'
                            return (
                                <button
                                    key={e.id}
                                    onClick={() => setActiveEncounter(currentCampaignId, e.id)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        isActive
                                            ? 'bg-accent text-accent-fg'
                                            : 'bg-ui-surface2 text-ui-muted hover:text-ui-text'
                                    }`}
                                >
                                    {running ? '⚔ ' : ''}{e.name}
                                </button>
                            )
                        })}
                        <Link to="/encounters" className="ml-auto text-xs text-ui-muted hover:text-ui-text underline self-center">
                            {t('nav.encounters')} →
                        </Link>
                    </div>
                    {active && <EncounterCombatPanel encounter={active} campaignId={currentCampaignId} />}
                </>
            )}
        </div>
    )
}

export default CombatBoard
