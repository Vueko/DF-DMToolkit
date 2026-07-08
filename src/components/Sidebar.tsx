import { NavLink } from 'react-router-dom'
import { useCampaignStore } from '../store/campaignStore'
import { useT } from '../i18n'

const navItems = [
    { path: '/', label: 'nav.dashboard' },
    { path: '/campaigns', label: 'nav.campaigns' },
    { path: '/scenes', label: 'nav.scenes' },
    { path: '/bestiary', label: 'nav.bestiary' },
    { path: '/encounters', label: 'nav.encounters' },
    { path: '/party', label: 'nav.party' },
    { path: '/rules', label: 'nav.glossary' },
    { path: '/music', label: 'nav.music' },
    { path: '/journal', label: 'nav.wiki' },
    { path: '/map', label: 'nav.map' },
    { path: '/soundboard', label: 'nav.soundboard' },
]

function Sidebar() {
    const t = useT()
    const { campaigns, currentCampaignId } = useCampaignStore()
    const currentCampaign = campaigns.find((c) => c.id === currentCampaignId) ?? null

    return (
        <aside className="w-64 bg-ui-canvas flex flex-col px-4 pt-3 pb-4 gap-1 border-r border-ui-surface/30">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                            ? 'bg-accent text-accent-fg font-medium'
                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                        }`
                    }
                >
                    <span>{t(item.label)}</span>
                </NavLink>
            ))}
            <div className="mt-auto flex flex-col gap-1">
                <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                            ? 'bg-accent text-accent-fg font-medium'
                            : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2'
                        }`
                    }
                >
                    <span>⚙ {t('nav.settings')}</span>
                </NavLink>
                <div className="pt-3 border-t border-ui-surface/30">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ui-muted px-3 mb-1">{t('sidebar.campaignLabel')}</p>
                    <p className="text-xs text-ui-text px-3 truncate">
                        {currentCampaign?.name ?? t('sidebar.noCampaign')}
                    </p>
                </div>
            </div>
        </aside>
    )
}

export default Sidebar