import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useLocation, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PageLoader } from './components/ui'
import { useSettingsStore } from './store/settingsStore'
import { useCombatStore, combatOf } from './store/combatStore'
import { usePartyStore, partyOf } from './store/partyStore'
import { useCampaignStore } from './store/campaignStore'
import { buildInitiativePayload } from './utils/playerInitiative'
import { useVaultStore } from './vault/vaultStore'
import Sidebar from './components/Sidebar'
import TitleBar from './components/TitleBar'
import MusicBar from './components/MusicBar'
import { SoundboardProvider } from './context/SoundboardContext'
import AmbientBar from './components/AmbientBar'
import SoundQuickBar from './components/SoundQuickBar'
import { UpdateNotification } from './components/UpdateNotification'
import { useUpdateStore } from './store/updateStore'

const DMDashboard = lazy(() => import('./pages/DMDashboard'))
const SceneTracker = lazy(() => import('./pages/SceneTracker'))
const Bestiary = lazy(() => import('./pages/Bestiary'))
const EncounterBuilder = lazy(() => import('./pages/EncounterBuilder'))
const Party = lazy(() => import('./pages/Party'))
const Glossary = lazy(() => import('./pages/Glossary'))
const AudioHub = lazy(() => import('./pages/AudioHub'))
const WorldWiki = lazy(() => import('./pages/WorldWiki'))
const CampaignMap = lazy(() => import('./pages/CampaignMap'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const Settings = lazy(() => import('./pages/Settings'))
const PlayerScreen = lazy(() => import('./pages/PlayerScreen'))

function Layout() {
  useEffect(() => {
    useVaultStore.getState().load()
  }, [])

  // Proyecta a la pantalla de jugador el combate del encuentro ACTIVO de la campaña actual.
  useEffect(() => {
    const send = () => {
      const { campaigns, currentCampaignId } = useCampaignStore.getState()
      const campaign = campaigns.find((c) => c.id === currentCampaignId)
      const combat = combatOf(useCombatStore.getState(), campaign?.activeEncounterId)
      const members = partyOf(usePartyStore.getState(), currentCampaignId)
      window.electron.player.setInitiative(buildInitiativePayload(combat, members))
    }
    send()
    const offCombat = useCombatStore.subscribe(send)
    const offParty = usePartyStore.subscribe(send)
    const offCampaign = useCampaignStore.subscribe(send)
    return () => { offCombat(); offParty(); offCampaign() }
  }, [])

  const theme = useSettingsStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const uiScale = useSettingsStore((s) => s.uiScale)
  useEffect(() => {
    window.electron.setZoom(uiScale)
  }, [uiScale])

  useEffect(() => {
    const off = window.electron.updater.onEvent((ev) => useUpdateStore.getState().apply(ev))
    // Diferimos el chequeo de actualización (red) para no competir con el arranque;
    // la ventana pinta primero y la comprobación ocurre en cuanto el hilo está libre.
    const id = setTimeout(() => window.electron.updater.check(), 4000)
    return () => { clearTimeout(id); off() }
  }, [])

  const location = useLocation()

  return (
    <div className="flex flex-col h-screen bg-ui-bg">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 bg-ui-canvas overflow-y-auto">
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary key={location.pathname} variant="page">
              <div className="page-fade h-full">
                <Outlet />
              </div>
            </ErrorBoundary>
          </Suspense>
        </main>
      </div>
      <SoundQuickBar />
      <MusicBar />
      <AmbientBar />
      <UpdateNotification />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary variant="root">
      <SoundboardProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DMDashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/scenes" element={<SceneTracker />} />
            <Route path="/bestiary" element={<Bestiary />} />
            <Route path="/encounters" element={<EncounterBuilder />} />
            <Route path="/party" element={<Party />} />
            <Route path="/rules" element={<Glossary />} />
            <Route path="/audio" element={<AudioHub />} />
            <Route path="/music" element={<Navigate to="/audio?tab=music" replace />} />
            <Route path="/soundboard" element={<Navigate to="/audio?tab=sounds" replace />} />
            <Route path="/journal" element={<WorldWiki />} />
            <Route path="/map" element={<CampaignMap />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route
            path="/player-screen"
            element={
              <Suspense fallback={<PageLoader />}>
                <PlayerScreen />
              </Suspense>
            }
          />
        </Routes>
      </SoundboardProvider>
    </ErrorBoundary>
  )
}

export default App
