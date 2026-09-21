import "server-only"

import { companyMilestones } from "@/lib/data/site"
import { env } from "@/lib/env"
import { fetchStrapi, toEntries } from "@/lib/strapi/client"
import { strapiTags } from "@/lib/strapi/tags"
import { milestoneSchema, type Milestone } from "../schema"
import { mapStrapiMilestone } from "../mappers"

const useStrapi = Boolean(env.STRAPI_API_URL)
const revalidate = env.STRAPI_REVALIDATE_SECONDS

export async function fetchMilestones(): Promise<Milestone[]> {
  if (useStrapi) {
    return fetchStrapi("/api/milestones?sort=year:asc", {
      parse: (data) => milestoneSchema.array().parse(toEntries(data).map(mapStrapiMilestone)),
      tags: [strapiTags.timeline.all()],
      revalidate,
    })
  }
  return milestoneSchema.array().parse(companyMilestones)
}
