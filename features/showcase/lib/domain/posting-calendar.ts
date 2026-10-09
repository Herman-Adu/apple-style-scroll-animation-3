/**
 * The posting calendar: one month of slots, each binding a slot to an asset, a
 * line of copy and a destination.
 *
 * It is data here rather than prose in the launch kit because prose cannot be
 * checked. The site-tour and enquiry clips were published in S41 and appeared in
 * no posting plan for three sprints; `qa/unit/showcase/posting-calendar.test.ts`
 * now fails the moment the repo publishes a cut, clip or carousel that no slot
 * schedules, and fails again if a slot names an asset that is not on disk.
 *
 * Paths are never spelled out here. Every asset is an `AssetRef` resolved
 * through `asset-paths.ts`, the one place the published layout is written down.
 */

import { absoluteUrl } from "@/lib/seo/site"
import { type AssetGroup, carouselPdfPath, socialAssetPath, videoPath } from "./asset-paths"

/** Channels in the order a week visits them before the weekly rotation is applied. */
export const CHANNELS = ["linkedin", "telegram", "x", "facebook"] as const

export type Channel = (typeof CHANNELS)[number]

/** Tuesday to Friday. Nothing is scheduled at a weekend, where reach is lowest. */
export const POSTING_DAYS = ["tue", "wed", "thu", "fri"] as const

export type PostingDay = (typeof POSTING_DAYS)[number]

/** Monday of week one. Moving the whole month means changing this one line. */
export const CALENDAR_START = "2026-10-12"

export const CALENDAR_WEEKS = 4

/** Days are offsets from that Monday, so a date is never typed twice. */
const DAY_OFFSET: Record<PostingDay, number> = { tue: 1, wed: 2, thu: 3, fri: 4 }

/**
 * What a slot posts. A ref addresses a published asset by what it is, and
 * `assetRefPath` turns it into the URL the docs link to.
 */
export type AssetRef =
  | { kind: "video"; group: string; format: "4x5" | "9x16" | "landscape" }
  | { kind: "carousel"; group: AssetGroup }
  | { kind: "social"; id: string }

export type SlotFormat = "video" | "carousel"

export type PostingSlot = {
  week: number
  day: PostingDay
  channel: Channel
  /** The post itself: a video or a swipeable carousel. */
  asset: AssetRef
  /** A still for channels that cannot take a PDF. */
  support?: AssetRef
  /** The hook. Measured numbers belong in facts, never typed in here. */
  hook: string
  /** A public docs slug. An owner-gated page would 404 for everyone the post reaches. */
  docSlug: string
}

/** Where a ref is published, as a public URL. */
export function assetRefPath(ref: AssetRef): string {
  if (ref.kind === "video") return videoPath(ref.group, ref.format, "mp4")
  if (ref.kind === "carousel") return carouselPdfPath(ref.group)
  return socialAssetPath(ref.id)
}

/** A ref's identity, for spotting the same asset booked into two slots. */
export function assetRefKey(ref: AssetRef): string {
  return ref.kind === "social" ? `social:${ref.id}` : `${ref.kind}:${ref.group}`
}

export function slotFormat(slot: PostingSlot): SlotFormat {
  return slot.asset.kind === "video" ? "video" : "carousel"
}

export function slotDate(slot: PostingSlot): string {
  const date = new Date(`${CALENDAR_START}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + (slot.week - 1) * 7 + DAY_OFFSET[slot.day])
  return date.toISOString().slice(0, 10)
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** The slot's date as the launch kit prints it, e.g. "Tue 13 Oct". */
export function slotWhen(slot: PostingSlot): string {
  const date = new Date(`${slotDate(slot)}T00:00:00Z`)
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`
}

/**
 * The link to post, already absolute against the canonical origin so the copy is
 * ready to paste. It must be the canonical host: the app answers on its Vercel
 * hosts too, but a session started there is lost after checkout.
 */
export function docLink(slot: PostingSlot): string {
  return absoluteUrl(`/docs/${slot.docSlug}`)
}

/** What each published video is called, so the kit never prints a folder name. */
const VIDEO_LABELS: Record<string, string> = {
  buyer: "Buyer cut",
  recruiter: "Recruiter cut",
  engineer: "Engineer cut",
  journey: "Journey clip",
  restock: "Back-in-stock clip",
  sitetour: "Site tour clip",
  enquiry: "Enquiry form clip",
  storefront: "Storefront demo clip",
}

/** What each carousel group is called in prose. */
const GROUP_LABELS: Record<string, string> = {
  buyer: "Buyer",
  engineer: "Engineer",
  recruiter: "Recruiter",
  security: "Security",
  "how-it-was-built": "How it was built",
  "checkout-sequence": "Checkout sequence",
  "site-tour": "Site tour",
  "email-case-study": "Email case study",
}

const FORMAT_LABELS: Record<string, string> = { "4x5": "4:5", "9x16": "9:16", landscape: "landscape" }

/** An asset in words, with its format, for the kit to print. */
export function assetRefLabel(ref: AssetRef): string {
  if (ref.kind === "video") {
    return `${VIDEO_LABELS[ref.group] ?? ref.group}, ${FORMAT_LABELS[ref.format] ?? ref.format}`
  }
  if (ref.kind === "carousel") return `${GROUP_LABELS[ref.group] ?? ref.group} carousel`
  return `${ref.id} still`
}

/**
 * How many of the sixteen slots each channel gets.
 *
 * Not an even split, deliberately. The month is for recruitment, and hiring
 * managers are on LinkedIn, so LinkedIn takes nearly half the slots and posts
 * every week. An even rotation would read as fairer and work worse.
 */
export const CHANNEL_POSTS: Record<Channel, number> = {
  linkedin: 7,
  x: 3,
  telegram: 3,
  facebook: 3,
}

/**
 * The assets that do the hiring. These go out in week one: they are the reason
 * the month exists, and burying them behind client material wastes the launch.
 */
export const RECRUITMENT_ASSETS: readonly string[] = [
  "video:recruiter",
  "carousel:recruiter",
  "video:engineer",
  "carousel:how-it-was-built",
]

/** How a channel takes each format. The "destination" half of a slot. */
const DELIVERY: Record<Channel, Record<SlotFormat, string>> = {
  linkedin: {
    video: "Upload natively in the feed, never as a link; native video reaches far more people.",
    carousel: "Upload the group's carousel.pdf as a document post, which swipes and holds attention longest.",
  },
  telegram: {
    video: "Send the file to the channel so it plays inline.",
    carousel: "Send the group's slides as one album, in order, so they swipe like the PDF.",
  },
  x: {
    video: "Attach to the thread opener, then answer replies with the doc link.",
    carousel: "Attach the support still to the opener and put the remaining slides in replies.",
  },
  facebook: {
    video: "Upload natively to the page; the feed favours its own player.",
    carousel: "Post the group's slides as one multi-image post, cover first.",
  },
}

export function deliveryFor(channel: Channel, format: SlotFormat): string {
  return DELIVERY[channel][format]
}

/**
 * Whether a channel can post a PDF as a swipeable document. LinkedIn and
 * Telegram can; X and Facebook cannot, so a carousel reaches them as the
 * group's images and needs a still for the opening post.
 */
const PDF_CHANNELS: ReadonlySet<Channel> = new Set<Channel>(["linkedin", "telegram"])

export function takesPdf(channel: Channel): boolean {
  return PDF_CHANNELS.has(channel)
}

/** A theme per week, so a week reads as one argument rather than four posts. */
export const WEEK_THEMES: Record<number, string> = {
  1: "Recruitment proof",
  2: "Engineering depth",
  3: "The store works",
  4: "Breadth, and the ask",
}
