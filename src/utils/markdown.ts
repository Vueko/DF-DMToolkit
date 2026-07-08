// Algunos textos del SRD (Open5e) llegan con secuencias de escape LITERALES —los dos
// caracteres "\" + "n", no un salto de línea real— sobre todo en objetos mágicos (527 de
// ellos, p.ej. todas las variantes de Spell Scroll). Sin normalizarlas, react-markdown trata
// la descripción como una sola línea y las tablas se renderizan como texto con barras.
// Convertimos \r\n, \r, \n y \t literales a sus caracteres reales.
export function unescapeMarkdown(text: string): string {
    if (!text) return ''
    // Si ya trae saltos de línea reales está bien formado (notas del vault, SRD correcto):
    // no lo tocamos, para no romper, p.ej., muestras de código con "\n" dentro. Solo
    // normalizamos el caso roto: una descripción en una sola línea con escapes literales.
    if (text.includes('\n')) return text
    return text
        .replace(/\\r\\n/g, '\n')
        .replace(/\\r/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
}
