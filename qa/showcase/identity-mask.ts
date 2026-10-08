import { DEMO_ADMIN } from "../../scripts/lib/showcase-admin.mjs"
import { DEMO_EMAIL_DOMAIN } from "../../scripts/lib/showcase-demo-data.mjs"

/**
 * Real people are not hidden by the demo seed: the admin's orders, customers and
 * messages show whatever is in the database, next to the demo rows. A recording is
 * posted publicly, so every real name and address is swapped for a stand-in before
 * the page paints.
 *
 * The sign-in mask this replaces only ever rewrote the signed-in admin's own
 * address, and switched itself off entirely for the seeded demo admin.
 */

/** Someone who would otherwise appear by name in a recording. */
export interface RealIdentity {
  name: string
  email: string
}

export interface IdentityAlias {
  /** The real value. Kept for the tests and for reading a plan back. */
  from: string
  to: string
  /** The matching rule, serialized here so the page never re-derives it. */
  pattern: string
  flags: string
}

/**
 * Obviously fictional stand-ins, deliberately not the names the demo seed uses,
 * so a masked row is never mistaken for a seeded one while reviewing a take.
 */
const STAND_IN_NAMES = [
  "Robin Hale",
  "Sadie Okonkwo",
  "Felix Brandt",
  "Nadia Serrano",
  "Oscar Lindell",
  "Priya Raman",
  "Tobias Moreau",
  "Elena Fischer",
  "Casper Nyholm",
  "Yara Haddad",
  "Milo Vance",
  "Ingrid Solberg",
  "Rafael Duarte",
  "Hana Mori",
  "Dominic Pryce",
  "Leila Farouk",
  "Anton Keller",
  "Beatrix Vogel",
  "Cyrus Patel",
  "Delphine Roux",
] as const

const demoSuffix = `@${DEMO_EMAIL_DOMAIN}`

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * A name is matched on word boundaries, so a customer called "Mo" cannot eat the
 * "Mo" inside "Momo Audio". An address is distinctive enough to match anywhere,
 * which is what catches "name · address" rendered as one run of text.
 */
function patternFor(value: string): { pattern: string; flags: string } {
  const escaped = escapeRegExp(value)
  return value.includes("@") ? { pattern: escaped, flags: "gi" } : { pattern: `\\b${escaped}\\b`, flags: "gi" }
}

function alias(from: string, to: string): IdentityAlias {
  return { from, to, ...patternFor(from) }
}

function isDemoValue(value: string) {
  return value.toLowerCase().endsWith(demoSuffix)
}

/** "Robin Hale" -> "robin.hale", so a stand-in address reads like its stand-in name. */
function localPart(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")
}

function standInName(index: number) {
  const name = STAND_IN_NAMES[index % STAND_IN_NAMES.length]
  const round = Math.floor(index / STAND_IN_NAMES.length)
  return round === 0 ? name : `${name} ${round + 1}`
}

/** Applies the aliases to one piece of text. The page runs exactly these patterns. */
export function applyIdentityMask(text: string, aliases: readonly IdentityAlias[]): string {
  return aliases.reduce((masked, { pattern, flags, to }) => masked.replace(new RegExp(pattern, flags), to), text)
}

export interface MaskOptions {
  /** The account being signed in with, shown as the demo admin so the sign-in on camera still reads right. */
  signedInAs?: string
}

/**
 * Stand-ins for everyone real, longest value first so a short name inside a longer
 * one is never half-replaced. Stable for a given set of people, so two takes of the
 * same clip show the same names.
 */
export function buildIdentityAliases(
  identities: readonly RealIdentity[],
  { signedInAs }: MaskOptions = {},
): IdentityAlias[] {
  // Someone is their address plus whatever names they are listed under, so the
  // one stand-in covers both. Aliasing names and addresses separately gives a row
  // like "Elena Fischer · robin.hale@…", which reads as a mistake on camera.
  const people = new Map<string, { email: string; names: Set<string> }>()
  const nameOnly = new Set<string>()

  for (const { name, email } of identities) {
    const address = email.trim()
    const person = name.trim()
    const realName = person !== "" && !isDemoValue(person)

    if (address !== "" && !isDemoValue(address)) {
      if (!address.includes("@")) throw new Error(`"${address}" is not an email address, so it cannot be masked`)
      const key = address.toLowerCase()
      const record = people.get(key) ?? { email: address, names: new Set<string>() }
      if (realName) record.names.add(person)
      people.set(key, record)
    } else if (realName) {
      nameOnly.add(person)
    }
  }

  // A name that turns up with an address somewhere is not a separate person.
  for (const record of people.values()) for (const person of record.names) nameOnly.delete(person)

  const names = new Set([...people.values()].flatMap((record) => [...record.names]).concat([...nameOnly]))
  const emails = new Map([...people].map(([key, record]) => [key, record.email]))
  const real = [...names, ...emails.values()].map((value) => alias(value, ""))
  // A stand-in that its own patterns would rewrite makes the page mask its own
  // output, and the observer never settles. Skip any such stand-in.
  const safe = (candidate: string) => applyIdentityMask(candidate, real) === candidate

  const aliases: IdentityAlias[] = []
  let next = 0
  const take = () => {
    for (let attempt = 0; attempt < STAND_IN_NAMES.length * 4; attempt++) {
      const name = standInName(next++)
      const address = `${localPart(name)}${demoSuffix}`
      if (safe(name) && safe(address)) return { name, address }
    }
    throw new Error("No stand-in is free of the real names being masked")
  }

  for (const key of [...people.keys()].sort()) {
    const { email, names: listedAs } = people.get(key)!
    const signedIn = signedInAs?.toLowerCase() === key
    const standIn = signedIn ? { name: DEMO_ADMIN.name, address: DEMO_ADMIN.email } : take()
    aliases.push(alias(email, standIn.address))
    for (const person of [...listedAs].sort()) aliases.push(alias(person, standIn.name))
  }
  for (const person of [...nameOnly].sort()) aliases.push(alias(person, take().name))

  return aliases.sort((a, b) => b.from.length - a.from.length || a.from.localeCompare(b.from))
}

/**
 * Runs in the page before anything renders. Rewrites every text node holding a
 * real value, and makes avatar photos fail to load so the component falls back to
 * initials — they are inline data URLs, so no request can be blocked instead.
 */
export function identityMaskScript({ aliases }: { aliases: IdentityAlias[] }) {
  const rules = aliases.map(({ pattern, flags, to }) => ({ match: new RegExp(pattern, flags), to }))
  const BROKEN_AVATAR = "data:image/gif;base64,masked"

  const maskAll = () => {
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue
      if (!text) continue
      let masked = text
      for (const { match, to } of rules) masked = masked.replace(match, to)
      if (masked !== text) node.nodeValue = masked
    }
    for (const image of document.querySelectorAll<HTMLImageElement>("span.rounded-full img")) {
      if (image.src.startsWith("data:") && image.src !== BROKEN_AVATAR) image.src = BROKEN_AVATAR
    }
  }

  new MutationObserver(maskAll).observe(document, { childList: true, subtree: true, characterData: true })
  document.addEventListener("DOMContentLoaded", maskAll)
}
