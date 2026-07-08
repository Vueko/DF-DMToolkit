import { useState, useEffect } from 'react'
import { useT } from '../i18n'

function TitleBar() {
  const t = useT()
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electron.window.isMaximized().then(setIsMaximized)
    return window.electron.window.onMaximize(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center h-10 bg-ui-canvas shrink-0 select-none border-b border-ui-surface/40"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="w-64 px-4 flex items-center gap-2 shrink-0">
        <span className="text-danger-yellow font-display font-bold tracking-widest text-sm">D&D5E</span>
        <span className="text-ui-muted text-xs">{t('titlebar.subtitle')}</span>
      </div>

      <div className="flex-1" />

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.electron.window.minimize()}
          className="h-full px-4 text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors text-xs"
          title={t('titlebar.minimize')}
        >
          ─
        </button>
        <button
          onClick={() => window.electron.window.maximize()}
          className="h-full px-4 text-ui-muted hover:text-ui-text hover:bg-ui-surface2 transition-colors text-xs"
          title={isMaximized ? t('titlebar.restore') : t('titlebar.maximize')}
        >
          {isMaximized ? '❐' : '□'}
        </button>
        <button
          onClick={() => window.electron.window.close()}
          className="h-full px-4 text-ui-muted hover:text-white hover:bg-red-500 transition-colors text-xs"
          title={t('titlebar.close')}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default TitleBar