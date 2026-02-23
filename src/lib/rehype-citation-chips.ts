import type { Element, ElementContent, Text } from 'hast'
import { visit } from 'unist-util-visit'

const CITATION_PATTERN = /\[(\d+)\]/g

function splitTextWithCitations(node: Text): ElementContent[] {
  const text = node.value
  const parts: ElementContent[] = []
  let lastIndex = 0

  for (const match of text.matchAll(CITATION_PATTERN)) {
    const index = match.index ?? 0
    const num = match[1]

    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) })
    }

    parts.push({
      type: 'element',
      tagName: 'span',
      properties: {
        className: ['citation-chip'],
        'data-citation': num,
      },
      children: [{ type: 'text', value: num }],
    })

    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return parts
}

export function rehypeCitationChips() {
  return (tree: Element) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined) {
        return
      }

      if (!CITATION_PATTERN.test(node.value)) {
        return
      }

      // Reset regex lastIndex after test
      CITATION_PATTERN.lastIndex = 0

      const parts = splitTextWithCitations(node)

      if (parts.length > 1) {
        parent.children.splice(index, 1, ...parts)
        return index + parts.length
      }
    })
  }
}
