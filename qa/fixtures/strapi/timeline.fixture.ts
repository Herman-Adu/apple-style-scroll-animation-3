/**
 * Hand-written Strapi payload for company timeline milestones, in the flat
 * `{ data, meta }` envelope `mapStrapiMilestone` consumes.
 */
export const strapiMilestoneEntries = [
  { id: 1, documentId: "ms_2016", year: "2016", title: "Founded in Copenhagen", description: "Three engineers and one anechoic chamber.", icon: "compass" },
  { id: 2, documentId: "ms_2019", year: "2019", title: "First planar driver", description: "The 40mm driver that would become Momo X.", icon: "waveform" },
]

export const milestoneListResponse = {
  data: strapiMilestoneEntries,
  meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 2 } },
}
