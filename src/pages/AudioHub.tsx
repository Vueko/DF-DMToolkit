import { useSearchParams } from 'react-router-dom'
import MusicSection from '../components/audio/MusicSection'
import SoundsSection from '../components/audio/SoundsSection'
import { useT } from '../i18n'

type AudioTab = 'music' | 'sounds'

function AudioHub() {
    const t = useT()
    const [params, setParams] = useSearchParams()
    const tab: AudioTab = params.get('tab') === 'sounds' ? 'sounds' : 'music'

    const setTab = (next: AudioTab) => setParams({ tab: next }, { replace: true })

    const tabClass = (active: boolean) =>
        `px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            active ? 'bg-arcane-light text-ui-canvas' : 'text-ui-muted hover:text-ui-text hover:bg-ui-surface2/60'
        }`

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <div className="flex items-center justify-between pb-4 shrink-0">
                <h1 className="text-2xl font-display font-bold text-ui-text">{t('audio.title')}</h1>
                <div className="flex gap-1 bg-ui-surface border border-ui-surface2 rounded-xl p-1">
                    <button onClick={() => setTab('music')} className={tabClass(tab === 'music')}>{t('audio.tabMusic')}</button>
                    <button onClick={() => setTab('sounds')} className={tabClass(tab === 'sounds')}>{t('audio.tabSounds')}</button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tab === 'music' ? <MusicSection /> : <SoundsSection />}
            </div>
        </div>
    )
}

export default AudioHub
