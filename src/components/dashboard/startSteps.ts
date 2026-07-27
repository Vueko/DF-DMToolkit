import type { Campaign, PartyMember } from '../../types'

export interface StartStep {
    id: string
    label: string
    done: boolean
    link: string
    linkLabel: string
}

// Flujo canónico para empezar a jugar; todo derivado del estado real (sin persistencia).
export function buildStartSteps(
    campaign: Campaign | null,
    members: PartyMember[],
    vaultPath: string | null,
    currentSessionId: string | null,
): { steps: StartStep[]; optional: StartStep[] } {
    const hasSession = (campaign?.sessions.length ?? 0) > 0
    const hasScenes = campaign?.sessions.some((s) => s.sceneIds.length > 0) ?? false
    const hasEncounters = (campaign?.encounters?.length ?? 0) > 0
    return {
        steps: [
            { id: 'campaign', label: 'start.step.campaign', done: !!campaign, link: '/campaigns', linkLabel: 'nav.campaigns' },
            { id: 'session', label: 'start.step.session', done: hasSession, link: '/campaigns', linkLabel: 'nav.campaigns' },
            { id: 'party', label: 'start.step.party', done: members.length > 0, link: '/party', linkLabel: 'nav.party' },
            { id: 'encounter', label: 'start.step.encounter', done: hasEncounters, link: '/encounters', linkLabel: 'nav.encounters' },
            { id: 'scenes', label: 'start.step.scenes', done: hasScenes, link: '/scenes', linkLabel: 'nav.scenes' },
            { id: 'activate', label: 'start.step.activate', done: currentSessionId !== null, link: '/campaigns', linkLabel: 'nav.campaigns' },
        ],
        optional: [
            { id: 'vault', label: 'start.optionalVault', done: !!vaultPath, link: '/settings', linkLabel: 'nav.settings' },
        ],
    }
}
