import { z } from "zod"

/** Company timeline milestones (the About page "decade of listening" section). */

export const milestoneIcons = ["compass", "waveform", "flask", "headphones"] as const

export const milestoneSchema = z.object({
  year: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.enum(milestoneIcons),
})
export type Milestone = z.infer<typeof milestoneSchema>
