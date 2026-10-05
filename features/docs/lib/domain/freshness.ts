import type { Doc } from "./schema"

type Block = Doc["body"][number]

function blockText(block: Block): string[] {
  switch (block.type) {
    case "paragraph":
    case "heading":
    case "quote":
      return [block.text]
    case "callout":
      return [block.title ?? "", block.text]
    case "list":
      return block.items
    case "steps":
      return block.items.flatMap((i) => [i.title, i.text])
    case "table":
      return [block.title ?? "", ...block.headers, ...block.rows.flat()]
    case "code":
      return [block.title ?? "", block.code]
    case "mermaid":
      return [block.title ?? "", block.caption ?? "", block.diagram]
    case "image":
      return [block.alt, block.caption ?? ""]
    default:
      return "caption" in block && typeof block.caption === "string" ? [block.caption] : []
  }
}

/** All human-readable text in a doc, for mention checks. */
export function docText(doc: Doc): string {
  return [doc.title, doc.summary, ...doc.body.flatMap(blockText)].join("\n")
}

/** Slugs referenced via `/docs/<slug>` links. Asset paths (with a file extension) are ignored. */
export function internalDocLinks(doc: Doc): string[] {
  const matches = docText(doc).matchAll(/(?<![a-z0-9_-])\/docs\/([a-z0-9-]+)(?![a-z0-9./-]*\.[a-zA-Z]{2,4}\b)(?=[^a-z0-9/-]|$)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

export function docImages(doc: Doc): string[] {
  return doc.body.flatMap((b) => (b.type === "image" ? [b.src] : []))
}

/** Terms not found in the text, compared case-insensitively. */
export function missingMentions(
  text: string,
  terms: readonly string[],
): string[] {
  const haystack = text.toLowerCase()
  return terms.filter((t) => !haystack.includes(t.toLowerCase()))
}
