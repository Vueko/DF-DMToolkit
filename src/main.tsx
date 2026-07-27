import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Medición de arranque (solo dev): tiempo hasta el primer frame pintado, para
// localizar el coste real del startup sin adivinar. No se incluye en producción.
if (import.meta.env.DEV) {
  requestAnimationFrame(() =>
    console.info(`[startup] first paint @ ${Math.round(performance.now())}ms`),
  )
}
