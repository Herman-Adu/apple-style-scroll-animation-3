import { describe, expect, it } from "vitest"
import { findHardCodedNumbers } from "@/features/showcase/lib/domain/facts"
import { infographics } from "@/features/showcase/lib/domain/infographics"

describe("no hard-coded numbers on slides", () => {
  it("flags a number typed into copy", () => {
    expect(findHardCodedNumbers({ title: "12 people are waiting" })).toEqual(["title"])
  })

  it("flags a raw numeric value", () => {
    expect(findHardCodedNumbers({ rows: [{ label: "Tests", after: 966 }] })).toEqual(["rows.0.after"])
  })

  it("flags a reference to a fact that does not exist", () => {
    expect(findHardCodedNumbers({ after: { fact: "tests.made-up" } })).toEqual(["after.fact"])
  })

  it("accepts fact references and number-free copy", () => {
    expect(findHardCodedNumbers({ title: "Measured, then fixed.", after: { fact: "arch.useEffect" } })).toEqual([])
  })

  it("accepts the sourced exceptions: package versions, route paths and the documented before baseline", () => {
    expect(findHardCodedNumbers({ version: "16", path: "/docs/[slug]", before: 55 })).toEqual([])
  })

  it.each(infographics.map((i) => [i.id, i] as const))("%s reads every number from facts", (_id, infographic) => {
    expect(findHardCodedNumbers(infographic)).toEqual([])
  })
})
