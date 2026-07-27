import { Link } from 'react-router-dom'

interface RequirementNoticeProps {
    title: string       // ya traducido
    hint?: string       // ya traducido
    link: string        // ruta que resuelve el requisito
    linkLabel: string   // ya traducido
}

// Aviso de requisito no cumplido con enlace para resolverlo (patrón compartido).
export function RequirementNotice({ title, hint, link, linkLabel }: RequirementNoticeProps) {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-ui-surface p-8 rounded-xl border border-ui-surface2 flex flex-col gap-2">
                <h2 className="text-xl text-ui-text font-display">{title}</h2>
                {hint ? <p className="text-ui-muted text-sm">{hint}</p> : null}
                <Link to={link} className="text-arcane-light hover:text-arcane-secondary text-sm transition-colors mt-2">
                    {linkLabel} →
                </Link>
            </div>
        </div>
    )
}
