export interface VaultNode {
    name: string                 // nombre con extensión (carpeta o archivo)
    path: string                 // ruta POSIX relativa al root del vault ('' = root)
    type: 'folder' | 'note' | 'image' | 'pdf' | 'doc'
    children?: VaultNode[]        // presente solo en carpetas
}

export interface VaultSearchResult {
    path: string                 // ruta POSIX relativa de la nota
    name: string                 // nombre de la nota sin .md
    snippet: string              // fragmento de contexto del match en contenido ('' si solo coincide el nombre)
    nameMatch: boolean           // true si el nombre coincide con la query
}
