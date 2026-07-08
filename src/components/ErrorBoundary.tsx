import { Component, type ReactNode, type ErrorInfo } from 'react'
import { useT } from '../i18n'

interface Props {
    variant: 'page' | 'root'
    children: ReactNode
}

interface State {
    error: Error | null
}

export function ErrorFallback({ variant, error, onRetry }: { variant: 'page' | 'root'; error: Error; onRetry?: () => void }) {
    const t = useT()
    const details = (
        <details className="mt-3 text-left w-full max-w-lg">
            <summary className="cursor-pointer text-xs text-ui-muted hover:text-ui-text">{t('error.techDetails')}</summary>
            <pre className="mt-2 text-[10px] text-ui-muted bg-ui-canvas border border-ui-surface2 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap">
                {error.message}{error.stack ? `\n\n${error.stack}` : ''}
            </pre>
        </details>
    )

    if (variant === 'root') {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center gap-3 bg-ui-bg text-ui-text p-6 text-center">
                <h1 className="text-xl font-display font-bold">{t('error.rootTitle')}</h1>
                <p className="text-sm text-ui-muted">{t('error.rootMessage')}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-1 px-4 py-2 bg-danger-primary text-white rounded-lg hover:bg-danger-gold transition-colors text-sm font-medium"
                >
                    {t('error.reloadApp')}
                </button>
                {details}
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 h-full text-center p-6">
            <h2 className="text-lg font-display font-bold text-ui-text">{t('error.pageTitle')}</h2>
            <p className="text-sm text-ui-muted">{t('error.pageMessage')}</p>
            <div className="flex gap-2 mt-1">
                <button
                    onClick={() => onRetry?.()}
                    className="px-4 py-2 bg-danger-primary text-white rounded-lg hover:bg-danger-gold transition-colors text-sm font-medium"
                >
                    {t('error.retry')}
                </button>
                <button
                    onClick={() => { window.location.hash = '#/'; onRetry?.() }}
                    className="px-4 py-2 bg-ui-surface2 text-ui-text rounded-lg hover:bg-ui-surface transition-colors text-sm font-medium"
                >
                    {t('error.goHome')}
                </button>
            </div>
            {details}
        </div>
    )
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null }

    static getDerivedStateFromError(error: Error): State {
        return { error }
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[ErrorBoundary]', error, info)
    }

    reset = (): void => this.setState({ error: null })

    render(): ReactNode {
        if (this.state.error) {
            return <ErrorFallback variant={this.props.variant} error={this.state.error} onRetry={this.reset} />
        }
        return this.props.children
    }
}
