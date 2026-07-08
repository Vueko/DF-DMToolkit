// Remark plugin: turn callout blockquotes into tagged nodes.
//
// Callout syntax:
//   > [!warning] Optional title
//   > body line 1
//   > body line 2
//
// We detect the `[!type]` marker on the first line of a blockquote, strip that
// marker line from the rendered body, and stash the type/title on the node via
// `data.hProperties` so the renderer (VaultMarkdown) can style it per type.

interface MdNode {
    type: string
    value?: string
    children?: MdNode[]
    data?: {
        hName?: string
        hProperties?: Record<string, unknown>
    }
}

// type, optional fold marker (+/-), then the title = rest of the FIRST line only.
// remark keeps the marker line and soft-wrapped body in a single text node joined
// by "\n", so we must NOT anchor to end-of-string ($) — match up to the newline.
const CALLOUT_RE = /^\[!([\w-]+)\]([+-]?)[ \t]*([^\r\n]*)/

function walk(node: MdNode, visit: (n: MdNode) => void): void {
    visit(node)
    node.children?.forEach((child) => walk(child, visit))
}

export function transformCallouts(tree: MdNode): void {
    walk(tree, (node) => {
        if (node.type !== 'blockquote' || !node.children?.length) return

        const firstPara = node.children[0]
        if (firstPara.type !== 'paragraph' || !firstPara.children?.length) return

        const firstText = firstPara.children[0]
        if (firstText.type !== 'text' || typeof firstText.value !== 'string') return

        const match = CALLOUT_RE.exec(firstText.value)
        if (!match) return

        const calloutType = match[1].toLowerCase()
        const title = (match[3] ?? '').trim()

        // Strip the marker line. The body may live in the SAME text node after a
        // "\n" (soft-wrapped), or in following nodes (break/text), or in a later
        // paragraph (blank `>` line).
        const rest = firstText.value.slice(match[0].length).replace(/^\r?\n/, '')
        if (rest.length > 0) {
            firstText.value = rest
        } else {
            firstPara.children.shift()
            if (firstPara.children[0]?.type === 'break') firstPara.children.shift()
            if (firstPara.children.length === 0) node.children.shift()
        }

        // Render as a <div class="callout callout-<type>"> so the renderer can detect
        // the callout via the reliably-passed className prop and CSS can style per type.
        node.data = node.data || {}
        node.data.hName = 'div'
        node.data.hProperties = {
            ...(node.data.hProperties || {}),
            className: ['callout', `callout-${calloutType}`],
            dataCalloutTitle: title,
        }
    })
}

export function remarkCallouts() {
    return (tree: MdNode): void => transformCallouts(tree)
}
