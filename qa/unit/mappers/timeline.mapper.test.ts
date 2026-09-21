import { describe, expect, it } from "vitest"

import { mapStrapiMilestone } from "@/features/timeline/mappers"
import { milestoneSchema } from "@/features/timeline/schema"
import { strapiMilestoneEntries } from "@/qa/fixtures/strapi/timeline.fixture"

describe("mapStrapiMilestone", () => {
  it("maps each milestone into a valid domain shape", () => {
    const parsed = strapiMilestoneEntries.map((e) => milestoneSchema.parse(mapStrapiMilestone(e)))
    expect(parsed).toHaveLength(2)
    expect(parsed[0]).toMatchObject({ year: "2016", icon: "compass" })
  })

  it("coerces a numeric year into a string", () => {
    const parsed = milestoneSchema.parse(mapStrapiMilestone({ ...strapiMilestoneEntries[0], year: 2016 }))
    expect(parsed.year).toBe("2016")
  })
})
