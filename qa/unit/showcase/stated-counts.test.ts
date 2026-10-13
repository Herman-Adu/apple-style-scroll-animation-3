import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { docs } from "@/features/docs/content"
import { DOC_AUDIENCES } from "@/features/docs/lib/domain/schema"
import { ASSET_GROUPS, carouselPdfPath, type AssetGroup } from "@/features/showcase/lib/domain/asset-paths"
import { packs } from "@/features/showcase/lib/domain/packs"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * Counts the docs library states in prose, checked against the thing they count.
 *
 * Both claims here are numbers a reader cannot verify: how many slides a
 * carousel has, and how many audiences the library is written for. Prose like
 * that goes stale silently - a carousel is re-exported one slide shorter and
 * the sentence describing it simply becomes false. So each stated count is
 * pinned to its artefact: the slide counts to the page count inside the
 * committed PDF, the audience count to the audiences the docs actually have.
 *
 * The page count is read from the PDF bytes rather than through a PDF library.
 * A new dependency would pull `pnpm build` into the gate for a page count, and
 * two derivations already agree on every file: the number of page objects, and
 * the `/Count` on the page tree.
 */

const CONTENT_DIR = join(REPO_ROOT, "features/docs/content")

const contentFiles = readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".ts"))

const contentSource = (file: string) => readFileSync(join(CONTENT_DIR, file), "utf8")

const publicPath = (file: string) => join(REPO_ROOT, "public", file.replace(/^[/\\]/, ""))

const docsText = JSON.stringify(docs.map((doc) => doc.body))

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
]

/** A count written either as digits or as a word, or null when it is neither. */
function parseCount(word: string): number | null {
  if (/^\d+$/.test(word)) return Number(word)
  const index = NUMBER_WORDS.indexOf(word.toLowerCase())
  return index === -1 ? null : index
}

/**
 * Page count straight from the PDF bytes, two independent ways. `pageObjects`
 * counts the page objects themselves; `treeCount` reads the largest `/Count`,
 * which on a nested page tree is the root's. They are compared rather than
 * trusted: a parse that found nothing would otherwise agree with any claim.
 */
function pdfPageCounts(file: string): { pageObjects: number; treeCount: number } {
  const bytes = readFileSync(publicPath(file)).toString("latin1")
  const pageObjects = (bytes.match(/\/Type\s*\/Page(?!\w)/g) ?? []).length
  const treeCounts = [...bytes.matchAll(/\/Count\s+(\d+)/g)].map((match) => Number(match[1]))
  return { pageObjects, treeCount: treeCounts.length === 0 ? 0 : Math.max(...treeCounts) }
}

const pdfPageCount = (group: AssetGroup) => pdfPageCounts(carouselPdfPath(group)).pageObjects

/** Every group that ships a carousel: the packs, plus the email case study. */
const carouselGroups = [...packs.map((pack) => pack.id), "email-case-study"] as AssetGroup[]

/**
 * Every stated slide count in the docs library, with the carousel it describes.
 * Each pattern locates its claim *without* the number, so a re-export at a
 * different length fails here instead of quietly making the prose false.
 */
const STATED_SLIDE_COUNTS: { group: AssetGroup; file: string; claim: RegExp }[] = [
  {
    group: "email-case-study",
    file: "social-launch-kit.ts",
    claim: /An (\S+)-slide LinkedIn carousel/,
  },
  {
    group: "recruiter",
    file: "social-launch-kit-packs.ts",
    claim: /([\w-]+) slides for recruiters and hiring managers/,
  },
  {
    group: "buyer",
    file: "social-launch-kit-packs.ts",
    claim: /([\w-]+) slides for business owners and buyers/,
  },
  {
    group: "engineer",
    file: "social-launch-kit-packs.ts",
    claim: /([\w-]+) slides for engineers and technical leads/,
  },
]

/** Any phrase in the library that counts slides or pages. */
const SLIDE_COUNT_PHRASE = /\b([\w-]+)[ -](slides?|pages?)\b/gi

/**
 * The count phrases that are not a carousel's length, lifted from the files
 * rather than invented: an allow case that nobody writes cannot catch a guard
 * that is too greedy (S52).
 */
const NOT_A_CAROUSEL_LENGTH = [
  // A step's position inside one slide's alt text, not a count of slides.
  "Step 3 of 5 slide titled",
  // A figure of speech about a diagram, not a page count.
  "The whole system on one page",
]

/** Any phrase that counts audiences. */
const AUDIENCE_COUNT_PHRASE = /\b([\w-]+)\s+(?:different\s+)?audiences\b/gi

/**
 * Counts of audiences that are not the docs library's, lifted from the file.
 * The launch pack writes posts for two reader groups; that is a different set
 * from the audiences the guides are organised by, and a naive sweep fails on it.
 */
const NOT_THE_DOCS_LIBRARY = ["posts for two audiences: recruiters and hiring managers"]

type Phrase = { file: string; line: number; text: string; source: string; count: number }

/** Every numeric count phrase in the library, with the line it sits on. */
function countPhrases(pattern: RegExp, allowed: string[]): Phrase[] {
  const found: Phrase[] = []
  for (const file of contentFiles) {
    contentSource(file)
      .split(/\r?\n/)
      .forEach((line, index) => {
        if (allowed.some((allow) => line.includes(allow))) return
        for (const match of line.matchAll(new RegExp(pattern.source, pattern.flags))) {
          const count = parseCount(match[1])
          if (count === null) continue
          found.push({ file, line: index + 1, text: match[0].trim(), source: line, count })
        }
      })
  }
  return found
}

describe("carousel slide counts come from the PDF", () => {
  it("reads a plausible page count out of every published carousel", () => {
    const published = ASSET_GROUPS.filter((group) => existsSync(publicPath(carouselPdfPath(group))))
    expect([...published].sort()).toEqual([...carouselGroups].sort())

    for (const group of published) {
      const { pageObjects, treeCount } = pdfPageCounts(carouselPdfPath(group))
      // A LinkedIn carousel is a handful of slides. A parse failure reads as 0
      // and would otherwise agree with whatever the prose claims.
      expect(pageObjects, group).toBeGreaterThanOrEqual(4)
      expect(pageObjects, group).toBeLessThanOrEqual(12)
      expect(treeCount, `${group}: page objects and page tree disagree`).toBe(pageObjects)
    }
  })

  it.each(STATED_SLIDE_COUNTS.map((stated) => [stated.group, stated] as const))(
    "the %s carousel is as long as the library says",
    (group, stated) => {
      const match = contentSource(stated.file).match(stated.claim)
      expect(match, `${stated.file} no longer states a slide count for ${group}`).not.toBeNull()
      expect(docsText, `"${match![0]}" is not in any doc body`).toContain(match![0])
      expect(parseCount(match![1]), `${stated.file}: "${match![0]}"`).toBe(pdfPageCount(group))
    },
  )

  it("pins every slide or page count the library states", () => {
    const unpinned = countPhrases(SLIDE_COUNT_PHRASE, NOT_A_CAROUSEL_LENGTH).filter(
      (phrase) =>
        !STATED_SLIDE_COUNTS.some(
          (stated) => stated.file === phrase.file && stated.claim.test(phrase.source),
        ),
    )
    expect(
      unpinned.map((phrase) => `${phrase.file}:${phrase.line} "${phrase.text}"`),
      "a stated count no test compares against an artefact",
    ).toEqual([])
  })
})

describe("the audience count the library states", () => {
  const audiences = [...new Set(docs.map((doc) => doc.audience))]

  it("is derived from the docs, not typed in", () => {
    expect([...audiences].sort()).toEqual([...DOC_AUDIENCES].sort())
    expect(audiences).toHaveLength(5)
  })

  it("is the same number everywhere the library states it", () => {
    const stated = countPhrases(AUDIENCE_COUNT_PHRASE, NOT_THE_DOCS_LIBRARY)
    // The library says it eight times today. A sweep that found nothing would
    // agree with any number, which is how a recount passes vacuously (S54).
    expect(stated.length).toBeGreaterThanOrEqual(5)
    expect(
      stated
        .filter((phrase) => phrase.count !== audiences.length)
        .map((phrase) => `${phrase.file}:${phrase.line} "${phrase.text}"`),
    ).toEqual([])
  })

  it("names each audience where it enumerates them", () => {
    const enumeration = contentSource("social-launch-kit.ts").match(
      /documentation library for [\w-]+ audiences: ([^.]+)\./,
    )
    expect(enumeration, "social-launch-kit.ts no longer enumerates the audiences").not.toBeNull()
    expect(enumeration![1].split(/,\s*|\s+and\s+/)).toHaveLength(audiences.length)
  })
})
