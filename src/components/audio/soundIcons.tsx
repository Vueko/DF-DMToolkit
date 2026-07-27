import type { ComponentType, ReactNode } from 'react'

interface IconProps { className?: string }

function makeIcon(children: ReactNode): ComponentType<IconProps> {
    return function SoundIcon({ className = 'w-5 h-5' }: IconProps) {
        return (
            <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {children}
            </svg>
        )
    }
}

// eslint-disable-next-line react-refresh/only-export-components
export const SOUND_ICONS: Record<string, ComponentType<IconProps>> = {
    rain: makeIcon(<><path d="M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2" /><path d="M16 14v6M8 14v6M12 16v6" /></>),
    snow: makeIcon(<><path d="M12 2v20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1M2 12h20" /></>),
    wind: makeIcon(<><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1 1 11 8H2" /><path d="M12.6 19.4A2 2 0 1 0 14 16H2" /></>),
    thunder: makeIcon(<path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />),
    fire: makeIcon(<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />),
    tavern: makeIcon(<><path d="M17 11h1a3 3 0 0 1 0 6h-1" /><path d="M9 11v6M13 11v6" /><path d="M5 8h12v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8z" /></>),
    forest: makeIcon(<><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17z" /><path d="M12 22v-3" /></>),
    cave: makeIcon(<path d="m8 3 4 8 5-5 5 15H2L8 3z" />),
    water: makeIcon(<><path d="M7 16.3c2.2 0 4-1.8 4-4 0-1.2-.6-2.3-1.7-3.2S7.3 6.8 7 5.3c-.3 1.5-1.1 2.8-2.3 3.8S3 11.1 3 12.3c0 2.2 1.8 4 4 4z" /><path d="M12.6 6.6A11 11 0 0 0 14 3c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 0 1-11.9 5" /></>),
    sword: makeIcon(<><path d="M14.5 17.5 3 6V3h3l11.5 11.5" /><path d="m13 19 6-6" /><path d="m16 16 4 4" /><path d="m19 21 2-2" /></>),
    magic: makeIcon(<><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" /><path d="M5 3v4M3 5h4" /></>),
    door: makeIcon(<><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3M13 20h9M10 12v.01" /><path d="M13 4.6v16.1a1 1 0 0 1-1.2 1L5 20V5.6a2 2 0 0 1 1.5-2l4-1A2 2 0 0 1 13 4.6z" /></>),
    monster: makeIcon(<><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.8 1L4.5 16.8A3.5 3.5 0 0 1 5.5 10Z" /></>),
    skull: makeIcon(<><circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" /><path d="M8 20v2h8v-2" /><path d="m12.5 17-.5-1-.5 1h1z" /><path d="M16 20a2 2 0 0 0 1.6-3.3 8 8 0 1 0-11.1 0A2 2 0 0 0 8 20" /></>),
    coins: makeIcon(<><circle cx="8" cy="8" r="6" /><path d="M18.1 10.4A6 6 0 1 1 10.3 18" /><path d="M7 6h1v4" /><path d="m16.7 13.9.7.7-2.8 2.8" /></>),
    arrow: makeIcon(<><path d="M2 22 20 4" /><path d="M20 4h-5M20 4v5" /><path d="m5 15 4 4" /></>),
    bell: makeIcon(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>),
    horn: makeIcon(<><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>),
    footsteps: makeIcon(<><path d="M4 16v-2.4C4 11.5 3 10.5 3 8c0-2.7 1.5-6 4.5-6C9.4 2 10 3.8 10 5.5c0 3.1-2 5.7-2 8.7V16a2 2 0 1 1-4 0z" /><path d="M20 20v-2.4c0-2.1 1-3.1 1-5.6 0-2.7-1.5-6-4.5-6C14.6 6 14 7.8 14 9.5c0 3.1 2 5.7 2 8.7V20a2 2 0 1 0 4 0z" /><path d="M16 17h4M4 13h4" /></>),
    music: makeIcon(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>),
}

export function SoundIconByKey({ icon, className }: { icon?: string; className?: string }) {
    const Icon = (icon && SOUND_ICONS[icon]) || SOUND_ICONS.music
    return <Icon className={className} />
}
