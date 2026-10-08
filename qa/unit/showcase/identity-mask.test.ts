import { describe, expect, it } from "vitest"
import { isReservedEmail } from "@/features/email/lib/domain/reserved-recipients"
import { DEMO_EMAIL_DOMAIN } from "../../../scripts/lib/showcase-demo-data.mjs"
import { DEMO_ADMIN } from "../../../scripts/lib/showcase-admin.mjs"
import { applyIdentityMask, buildIdentityAliases, type RealIdentity } from "../../showcase/identity-mask"

const people: RealIdentity[] = [
  { name: "Caroline Mensah", email: "caroline@example.co.uk" },
  { name: "Jen Adeyemi", email: "jen.adeyemi@somewhere.com" },
  { name: "Mo", email: "mo@elsewhere.org" },
]

const aliasFor = (value: string, aliases: { from: string; to: string }[]) =>
  aliases.find((alias) => alias.from === value)?.to

describe("buildIdentityAliases", () => {
  it("gives every real name and address a stand-in", () => {
    const aliases = buildIdentityAliases(people)
    for (const person of people) {
      expect(aliasFor(person.name, aliases), person.name).toBeTruthy()
      expect(aliasFor(person.email, aliases), person.email).toBeTruthy()
    }
  })

  it("puts every stand-in address on the reserved demo domain", () => {
    for (const alias of buildIdentityAliases(people)) {
      if (!alias.from.includes("@")) continue
      expect(alias.to, alias.to).toContain(`@${DEMO_EMAIL_DOMAIN}`)
      expect(isReservedEmail(alias.to), alias.to).toBe(true)
    }
  })

  it("never produces a stand-in that it would itself rewrite, so the page settles", () => {
    const aliases = buildIdentityAliases([...people, { name: "Robin", email: "robin@real.test" }])
    for (const alias of aliases) {
      expect(applyIdentityMask(alias.to, aliases), `${alias.to} is rewritten again`).toBe(alias.to)
    }
  })

  it("is stable: the same people in a different order get the same stand-ins", () => {
    const forwards = buildIdentityAliases(people)
    const backwards = buildIdentityAliases([...people].reverse())
    expect(backwards).toEqual(forwards)
  })

  it("replaces the longest value first, so one name inside another is not half-masked", () => {
    const aliases = buildIdentityAliases([
      { name: "Jo", email: "jo@example.com" },
      { name: "Jo Fitzgerald", email: "jo.fitzgerald@example.com" },
    ])
    const lengths = aliases.map((alias) => alias.from.length)
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a))
  })

  it("leaves demo addresses and blank names alone, because they are already stand-ins", () => {
    const aliases = buildIdentityAliases([
      { name: "", email: `shopper@${DEMO_EMAIL_DOMAIN}` },
      { name: "Real Person", email: "real@person.test" },
    ])
    expect(aliases.map((alias) => alias.from)).toEqual(["real@person.test", "Real Person"])
  })

  it("shows the signed-in admin as the demo admin, as the sign-in on camera already does", () => {
    const aliases = buildIdentityAliases(people, { signedInAs: "caroline@example.co.uk" })
    expect(aliasFor("caroline@example.co.uk", aliases)).toBe(DEMO_ADMIN.email)
  })

  it("keeps going when there are more people than stand-in names", () => {
    const crowd = Array.from({ length: 60 }, (_, i) => ({
      name: `Person Number${i}`,
      email: `person${i}@example.test`,
    }))
    const aliases = buildIdentityAliases(crowd)
    expect(aliases).toHaveLength(crowd.length * 2)
    expect(new Set(aliases.map((alias) => alias.to)).size).toBe(aliases.length)
  })

  it("refuses an identity it cannot mask, rather than recording someone real", () => {
    expect(() => buildIdentityAliases([{ name: "Someone", email: "not-an-email" }])).toThrow(/address/i)
  })
})

describe("applyIdentityMask", () => {
  const aliases = buildIdentityAliases(people)
  const mask = (text: string) => applyIdentityMask(text, aliases)

  it("masks a name and an address rendered as one run of text", () => {
    const masked = mask("Caroline Mensah · caroline@example.co.uk")
    expect(masked).not.toContain("Caroline")
    expect(masked).not.toContain("caroline@example.co.uk")
    expect(masked).toContain(" · ")
  })

  it("does not eat a short name out of the middle of a word", () => {
    expect(mask("Momo Audio")).toBe("Momo Audio")
    expect(mask("Mon 09:00")).toBe("Mon 09:00")
    expect(mask("More options")).toBe("More options")
  })

  it("still masks that short name when it stands on its own", () => {
    expect(mask("Mo · mo@elsewhere.org")).not.toContain("Mo ")
  })

  it("masks an address whatever case it is rendered in", () => {
    expect(mask("JEN.ADEYEMI@SOMEWHERE.COM")).not.toMatch(/somewhere\.com/i)
  })

  it("leaves text with nobody real in it exactly as it was", () => {
    const copy = "Orders, customers and analytics for Momo Audio"
    expect(mask(copy)).toBe(copy)
  })

  it("settles after one pass: masking twice changes nothing more", () => {
    const once = mask("Caroline Mensah · caroline@example.co.uk")
    expect(mask(once)).toBe(once)
  })
})
