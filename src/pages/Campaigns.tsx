import { useState } from 'react'
import { useCampaignStore } from '../store/campaignStore'
import type { Campaign, Session } from '../types'
import { Button, Input, PageHeader, EmptyState } from '../components/ui'
import { BackupControls } from '../components/BackupControls'
import { useT } from '../i18n'

function Campaigns() {
    const t = useT()
    const {
        campaigns,
        currentCampaignId,
        currentSessionId,
        addCampaign,
        removeCampaign,
        addSession,
        removeSession,
        setCurrentSession,
    } = useCampaignStore()

    const [newCampaignName, setNewCampaignName] = useState('')
    const [newSessionName, setNewSessionName] = useState('')
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null

    function handleAddCampaign() {
        if (!newCampaignName.trim()) return
        const campaign: Campaign = {
            id: crypto.randomUUID(),
            name: newCampaignName.trim(),
            scenes: [],
            sessions: [],
            playlists: [],
        }
        addCampaign(campaign)
        setNewCampaignName('')
        setSelectedCampaignId(campaign.id)
    }

    function handleAddSession() {
        if (!newSessionName.trim() || !selectedCampaignId) return
        const sessionCount = selectedCampaign?.sessions.length ?? 0
        const session: Session = {
            id: crypto.randomUUID(),
            name: newSessionName.trim(),
            number: sessionCount + 1,
            sceneIds: [],
            encounterIds: [],
        }
        addSession(selectedCampaignId, session)
        setNewSessionName('')
    }

    function handleSetActive(campaignId: string, sessionId: string) {
        setCurrentSession(campaignId, sessionId)
    }

    return (
        <div className="flex flex-col gap-6">

            <PageHeader title={t('campaigns.title')} subtitle={t('campaigns.subtitle')}>
                <BackupControls />
            </PageHeader>

            <div className="grid grid-cols-2 gap-6">

                <div className="flex flex-col gap-3">
                    <h2 className="text-ui-text font-semibold text-sm">{t('campaigns.campaigns')}</h2>

                    <div className="flex gap-2">
                        <Input
                            theme="danger"
                            type="text"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCampaign()}
                            placeholder={t('campaigns.campaignNamePlaceholder')}
                            className="flex-1"
                        />
                        <Button variant="primary" size="sm" onClick={handleAddCampaign}>{t('campaigns.add')}</Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        {campaigns.length === 0 && (
                            <EmptyState size="sm" title={t('campaigns.noCampaigns')} />
                        )}
                        {campaigns.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCampaignId(c.id)}
                                className={`flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors border ${
                                    selectedCampaignId === c.id
                                        ? 'bg-ui-surface2 border-arcane-light'
                                        : 'bg-ui-surface border-ui-surface2 hover:bg-ui-surface2'
                                }`}
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-ui-text text-sm font-medium">{c.name}</span>
                                    <span className="text-ui-muted text-xs">{t('campaigns.sessionsCount', { count: c.sessions.length })}</span>
                                </div>
                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); removeCampaign(c.id) }}>
                                    {t('campaigns.delete')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <h2 className="text-ui-text font-semibold text-sm">
                        {t('campaigns.sessions')} {selectedCampaign ? `— ${selectedCampaign.name}` : ''}
                    </h2>

                    {!selectedCampaign ? (
                        <p className="text-ui-muted text-sm text-center py-4">{t('campaigns.selectCampaign')}</p>
                    ) : (
                        <>
                            <div className="flex gap-2">
                                <Input
                                    theme="danger"
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSession()}
                                    placeholder={t('campaigns.sessionNamePlaceholder')}
                                    className="flex-1"
                                />
                                <Button variant="primary" size="sm" onClick={handleAddSession}>{t('campaigns.add')}</Button>
                            </div>

                            <div className="flex flex-col gap-2">
                                {selectedCampaign.sessions.length === 0 && (
                                    <EmptyState size="sm" title={t('campaigns.noSessions')} />
                                )}
                                {selectedCampaign.sessions.map((s) => {
                                    const isActive = currentCampaignId === selectedCampaignId && currentSessionId === s.id
                                    return (
                                        <div
                                            key={s.id}
                                            className={`flex items-center justify-between px-3 py-3 rounded-lg border transition-colors ${
                                                isActive
                                                    ? 'bg-ui-surface2 border-danger-primary'
                                                    : 'bg-ui-surface border-ui-surface2'
                                            }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-ui-text text-sm font-medium">
                                                    {t('campaigns.sessionLabel', { number: s.number, name: s.name })}
                                                </span>
                                                <span className="text-ui-muted text-xs">
                                                    {t('campaigns.scenesCount', { scenes: s.sceneIds.length })}
                                                </span>
                                                {isActive && (
                                                    <span className="text-danger-primary text-xs font-semibold">{t('campaigns.activeSession')}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isActive && (
                                                    <Button variant="secondary" size="sm" onClick={() => handleSetActive(selectedCampaignId!, s.id)}>
                                                        {t('campaigns.setActive')}
                                                    </Button>
                                                )}
                                                <Button variant="destructive" size="sm" onClick={() => removeSession(selectedCampaignId!, s.id)}>
                                                    {t('campaigns.delete')}
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}

export default Campaigns
