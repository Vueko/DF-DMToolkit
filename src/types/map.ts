export interface MapPoint {
    x: number
    y: number
}

export interface MapMarker extends MapPoint {
    id: string
    label: string
    noteRef?: string   // ruta relativa de la nota del vault
    color?: string
}

export interface FogZone {
    id: string
    x: number   // left edge as % of image width  (0–100)
    y: number   // top edge as % of image height (0–100)
    w: number   // width  as % of image width     (0–100)
    h: number   // height as % of image height    (0–100)
}

export interface PlayerViewport {
    offsetX: number  // pixel offset X (same coordinate system as DM local state)
    offsetY: number  // pixel offset Y
    scale: number    // zoom multiplier; 1.0 = natural image size
}

export interface CampaignMapData {
    image?: string
    markers: MapMarker[]
    path: MapPoint[]
    fogZones?: FogZone[]
    playerViewport?: PlayerViewport
}

export interface MapLibraryEntry {
    id: string
    name: string
    storedId: string
}
