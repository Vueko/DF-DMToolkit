import type { Campaign } from '../../types'

export interface PrepStep {
    id: string
    label: string
    done: boolean
    link?: string
    linkLabel?: string
}

export function buildPrepSteps(campaign: Campaign | null, vaultPath: string | null): PrepStep[] {
    const hasSession = (campaign?.sessions.length ?? 0) > 0
    const hasScenes = campaign?.sessions.some((s) => s.sceneIds.length > 0) ?? false
    return [
        { id: 'campaign', label: 'prep.campaign', done: !!campaign, link: '/campaigns', linkLabel: 'nav.campaigns' },
        { id: 'session', label: 'prep.session', done: hasSession, link: '/campaigns', linkLabel: 'nav.campaigns' },
        { id: 'vault', label: 'prep.vault', done: !!vaultPath, link: '/settings', linkLabel: 'nav.settings' },
        { id: 'scenes', label: 'prep.scenes', done: hasScenes, link: '/scenes', linkLabel: 'nav.scenes' },
    ]
}
