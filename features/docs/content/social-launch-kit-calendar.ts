import type { DocBlock } from "../lib/domain/schema"
import {
  CALENDAR_WEEKS,
  POSTING_DAYS,
  POSTING_CALENDAR,
  WEEK_THEMES,
  assetRefLabel,
  assetRefPath,
  deliveryFor,
  docLink,
  slotFormat,
  slotWhen,
  socialGroupPath,
  takesPdf,
  type PostingSlot,
} from "@/features/showcase"

const CHANNEL_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  telegram: "Telegram",
  x: "X",
  facebook: "Facebook",
}

const slotsIn = (week: number): PostingSlot[] =>
  POSTING_DAYS.map((day) => POSTING_CALENDAR.find((slot) => slot.week === week && slot.day === day)).filter(
    (slot): slot is PostingSlot => slot !== undefined,
  )

const dayHeaders = ["Tue — video", "Wed — carousel", "Thu — video", "Fri — carousel"]

/**
 * What to upload. A carousel only reaches LinkedIn and Telegram as its PDF; X
 * and Facebook take the group's images instead, so pointing them at the PDF
 * would be an instruction that cannot be followed.
 */
const uploadLine = (slot: PostingSlot): string => {
  if (slot.asset.kind === "carousel" && !takesPdf(slot.channel)) {
    return `Post the slides in ${socialGroupPath(slot.asset.group)}/ rather than the PDF.`
  }
  return `Upload ${assetRefPath(slot.asset)}.`
}

/** The month at a glance: one row per week, one column per posting day. */
const atAGlance: DocBlock = {
  type: "table",
  title: "The month at a glance",
  headers: ["Week", ...dayHeaders],
  rows: Array.from({ length: CALENDAR_WEEKS }, (_unused, index) => {
    const week = index + 1
    return [
      `${week}. ${WEEK_THEMES[week]}`,
      ...slotsIn(week).map((slot) => `${CHANNEL_NAMES[slot.channel]} — ${assetRefLabel(slot.asset)}`),
    ]
  }),
}

/** One step per slot, written so a step can be worked straight down the page. */
const weekBlocks = (week: number): DocBlock[] => {
  const slots = slotsIn(week)
  const span = slots.length > 0 ? `${slotWhen(slots[0])} to ${slotWhen(slots[slots.length - 1])}` : ""
  return [
    { type: "heading", text: `Week ${week} — ${WEEK_THEMES[week]} (${span})` },
    {
      type: "steps",
      items: slots.map((slot) => ({
        title: `${slotWhen(slot)} · ${CHANNEL_NAMES[slot.channel]} · ${assetRefLabel(slot.asset)}`,
        text: [
          `Copy: "${slot.hook}"`,
          uploadLine(slot),
          slot.support ? `Still for the opener: ${assetRefPath(slot.support)}.` : "",
          deliveryFor(slot.channel, slotFormat(slot)),
          `Link: ${docLink(slot)}`,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    },
  ]
}

/**
 * The posting calendar, rendered from `features/showcase/lib/domain/posting-schedule.ts`.
 * Nothing here is typed twice: change the schedule and this doc follows.
 */
export const launchKitCalendarBlocks: DocBlock[] = [
  { type: "heading", text: "Posting calendar" },
  {
    type: "paragraph",
    text: "Four weeks, four posts a week, one post per channel per week. Each week opens with a video and alternates video, carousel, video, carousel, and the channel order shifts one place each week so every channel ends the month with two videos and two carousels. Every cut, clip and carousel the repo publishes is scheduled exactly once, so nothing sits unposted and nothing goes out twice.",
  },
  {
    type: "paragraph",
    text: "The calendar is data, not prose: it lives in features/showcase/lib/domain/posting-schedule.ts and the rules live beside it in posting-calendar.ts. Dates are all derived from one start Monday, so moving the month means changing one line.",
  },
  atAGlance,
  ...Array.from({ length: CALENDAR_WEEKS }, (_unused, index) => weekBlocks(index + 1)).flat(),
  {
    type: "callout",
    variant: "note",
    title: "Adding an asset later",
    text: "Record or export it as usual, then give it a slot. qa/unit/showcase/posting-calendar.test.ts fails while any published cut, clip or carousel is scheduled nowhere, which is how the site tour and enquiry clips went three sprints without reaching a posting plan. It also fails if a slot names a file that is not on disk, books one asset twice, or links to a doc that is missing or owner-gated.",
  },
]
