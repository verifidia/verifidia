import type { Element, Properties } from 'hast'
import { toString } from 'hast-util-to-string'
import { visit } from 'unist-util-visit'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function rehypeHeadingIds() {
  return (tree: Element) => {
    visit(tree, 'element', (node: Element) => {
      if (['h1', 'h2', 'h3', 'h4'].includes(node.tagName)) {
        const text = toString(node)
        const id = slugify(text)
        node.properties = (node.properties ?? {}) as Properties
        node.properties.id = id
      }
    })
  }
}
