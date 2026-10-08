import { describe, expect, it } from "vitest"
import { isReservedEmail } from "@/features/email/lib/domain/reserved-recipients"
import { DEMO_EMAIL_DOMAIN } from "../../../scripts/lib/showcase-demo-data.mjs"
import { DEMO_ADMIN } from "../../../scripts/lib/showcase-admin.mjs"
import {
  applyIdentityMask,
  buildIdentityAliases,
  siteContactAliases,
  type RealIdentity,
} from "../../showcase/identity-mask"
import { contactChannels } from "@/features/contact"

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
    expect(aliasFor("Caroline Mensah", aliases)).toBe(DEMO_ADMIN.name)
  })

  it("gives one person one stand-in, so their name and address match on screen", () => {
    const aliases = buildIdentityAliases(people)
    for (const person of people) {
      const name = aliasFor(person.name, aliases)!
      const address = aliasFor(person.email, aliases)!
      expect(address, `${name} / ${address}`).toBe(`${name.toLowerCase().replace(/\s+/g, ".")}@${DEMO_EMAIL_DOMAIN}`)
    }
  })

  it("treats one person listed under two names as one person", () => {
    const aliases = buildIdentityAliases([
      { name: "Caroline Mensah", email: "caroline@example.co.uk" },
      { name: "C. Mensah", email: "caroline@example.co.uk" },
    ])
    expect(aliasFor("C. Mensah", aliases)).toBe(aliasFor("Caroline Mensah", aliases))
  })

  it("still masks a name that never appears with an address, like a review author", () => {
    const aliases = buildIdentityAliases([{ name: "Lone Reviewer", email: "" }])
    expect(aliasFor("Lone Reviewer", aliases)).toBeTruthy()
    expect(aliasFor("Lone Reviewer", aliases)).not.toBe("Lone Reviewer")
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

describe("siteContactAliases", () => {
  const aliases = siteContactAliases(contactChannels)
  const real = (id: string) => contactChannels.find((channel) => channel.id === id)!.value

  it("stands in for the store's own address and phone number", () => {
    for (const id of ["email", "phone"]) {
      const alias = aliases.find((candidate) => candidate.from === real(id))
      expect(alias, id).toBeDefined()
      expect(alias!.to, id).not.toBe(real(id))
    }
  })

  it("gives the store a company address on the demo domain, not a person's", () => {
    const email = aliases.find((alias) => alias.from === real("email"))!
    expect(email.to).toBe(`hello@${DEMO_EMAIL_DOMAIN}`)
    expect(isReservedEmail(email.to)).toBe(true)
  })

  it("uses a phone number that is never allocated to anyone", () => {
    // Ofcom reserves 07700 900000-900999 for drama, so it cannot ring a real person.
    const phone = aliases.find((alias) => alias.from === real("phone"))!
    expect(phone.to).toMatch(/^\+44 7700 900\d{3}$/)
  })

  it("leaves the studio address alone, because the store's locations are its own story", () => {
    expect(aliases.some((alias) => alias.from === real("studio"))).toBe(false)
  })

  it("replaces the real details wherever they are rendered", () => {
    const line = `Email ${real("email")} · Phone ${real("phone")}`
    const masked = applyIdentityMask(line, aliases)
    expect(masked).not.toContain(real("email"))
    expect(masked).not.toContain(real("phone"))
  })
})
