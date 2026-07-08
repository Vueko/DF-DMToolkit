// Slug used both to assign heading ids in VaultMarkdown and to scroll to them in
// WorldWiki — kept in its own module so the component file only exports components.
export function slugifyHeading(text: string): string {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
}
