import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { docs } from "@/features/docs/content"
import { findHardCodedNumbers } from "@/features/showcase/lib/domain/facts"
import {
  CALENDAR_START,
  CALENDAR_WEEKS,
  CHANNELS,
  POSTING_DAYS,
  assetRefKey,
  assetRefLabel,
  assetRefPath,
  deliveryFor,
  docLink,
  slotDate,
  slotFormat,
  slotWhen,
  takesPdf,
} from "@/features/showcase/lib/domain/posting-calendar"
import { POSTING_CALENDAR } from "@/features/showcase/lib/domain/posting-schedule"

/**
 * The calendar binds slot -> asset -> copy -> destination. These tests are the
 * reason it is data in a domain module rather than prose in the launch kit:
 * `sitetour` and `enquiry` were published in S41 and reached no posting plan for
 * three sprints, because nothing failed when an asset was scheduled nowhere.
 */
const showcase = path.join(REPO_ROOT, "public", "showcase")

/** Every video the repo publishes, as its folder name. One folder per cut or clip. */
const publishedVideoGroups = () =>
  readdirSync(path.join(showcase, "video"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)

/** Every swipeable carousel the repo publishes, as its group name. */
const publishedCarouselGroups = () =>
  readdirSync(path.join(showcase, "social"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(showcase, "social", entry.name, "carousel.pdf")))
    .map((entry) => entry.name)

const publicSlugs = new Set(docs.filter((doc) => doc.access === "public").map((doc) => doc.slug))

describe("posting calendar", () => {
  it("fills four weeks, four posts a week", () => {
    expect(CALENDAR_WEEKS).toBe(4)
    expect(POSTING_CALENDAR).toHaveLength(CALENDAR_WEEKS * POSTING_DAYS.length)
    for (let week = 1; week <= CALENDAR_WEEKS; week += 1) {
      const slots = POSTING_CALENDAR.filter((slot) => slot.week === week)
      expect(slots.map((slot) => slot.day), `week ${week}`).toEqual([...POSTING_DAYS])
    }
  })

  it("dates every slot from one start Monday", () => {
    expect(CALENDAR_START).toBe("2026-10-12")
    const first = POSTING_CALENDAR[0]
    const last = POSTING_CALENDAR.at(-1)
    expect(slotDate(first)).toBe("2026-10-13")
    expect(last && slotDate(last)).toBe("2026-11-06")
    // Tuesday through Friday, never a weekend, for all sixteen.
    for (const slot of POSTING_CALENDAR) {
      const weekday = new Date(`${slotDate(slot)}T00:00:00Z`).getUTCDay()
      expect(weekday, `${slotDate(slot)} is a weekday`).toBeGreaterThanOrEqual(2)
      expect(weekday, `${slotDate(slot)} is a weekday`).toBeLessThanOrEqual(5)
    }
  })

  it("schedules only assets that exist on disk", () => {
    const missing = POSTING_CALENDAR.flatMap((slot) =>
      [slot.asset, ...(slot.support ? [slot.support] : [])]
        .map((ref) => assetRefPath(ref))
        .filter((url) => !existsSync(path.join(REPO_ROOT, "public", url.replace(/^\//, ""))))
        .map((url) => `${slotDate(slot)} ${slot.channel} -> ${url}`),
    )
    expect(missing).toEqual([])
  })

  it("never books the same asset twice", () => {
    const booked = POSTING_CALENDAR.map((slot) => assetRefKey(slot.asset))
    const twice = booked.filter((key, index) => booked.indexOf(key) !== index)
    expect([...new Set(twice)], "assets scheduled more than once").toEqual([])
  })

  it("orphans no published video: every cut and clip gets exactly one slot", () => {
    const scheduled = POSTING_CALENDAR.filter((slot) => slot.asset.kind === "video").map(
      (slot) => (slot.asset as { group: string }).group,
    )
    expect([...scheduled].sort()).toEqual([...publishedVideoGroups()].sort())
  })

  it("orphans no published carousel: every group's PDF gets exactly one slot", () => {
    const scheduled = POSTING_CALENDAR.filter((slot) => slot.asset.kind === "carousel").map(
      (slot) => (slot.asset as { group: string }).group,
    )
    expect([...scheduled].sort()).toEqual([...publishedCarouselGroups()].sort())
  })

  it("links every slot to a doc that exists and is public", () => {
    const broken = POSTING_CALENDAR.filter((slot) => !publicSlugs.has(slot.docSlug)).map(
      (slot) => `${slot.channel} ${slotDate(slot)} -> ${slot.docSlug}`,
    )
    // An owner-gated slug would 404 for everyone the post reaches.
    expect(broken).toEqual([])
  })

  it("builds each link from the live-URL placeholder the kit uses", () => {
    expect(docLink(POSTING_CALENDAR[0])).toBe(`[live URL]/docs/${POSTING_CALENDAR[0].docSlug}`)
  })

  it("alternates video first, carousel second, every week", () => {
    for (let week = 1; week <= CALENDAR_WEEKS; week += 1) {
      // Keyed off the day, not the array order: a shuffled week must still fail.
      const formats = POSTING_DAYS.map((day) => {
        const slot = POSTING_CALENDAR.find((candidate) => candidate.week === week && candidate.day === day)
        return slot ? slotFormat(slot) : "missing"
      })
      expect(formats, `week ${week}`).toEqual(["video", "carousel", "video", "carousel"])
    }
  })

  it("gives every channel one post a week", () => {
    for (let week = 1; week <= CALENDAR_WEEKS; week += 1) {
      const used = POSTING_CALENDAR.filter((slot) => slot.week === week).map((slot) => slot.channel)
      expect([...used].sort(), `week ${week}`).toEqual([...CHANNELS].sort())
    }
  })

  it("rotates the channel order so each channel carries two videos and two carousels", () => {
    for (const channel of CHANNELS) {
      const formats = POSTING_CALENDAR.filter((slot) => slot.channel === channel).map(slotFormat)
      expect(formats.filter((format) => format === "video"), `${channel} videos`).toHaveLength(2)
      expect(formats.filter((format) => format === "carousel"), `${channel} carousels`).toHaveLength(2)
    }
  })

  it("tells every channel how to take both formats", () => {
    for (const channel of CHANNELS) {
      for (const format of ["video", "carousel"] as const) {
        expect(deliveryFor(channel, format), `${channel} ${format}`).toMatch(/\S/)
      }
    }
  })

  it("types no measured number into the copy", () => {
    // Same guard the slides pass: a number in a hook can drift from the code.
    const typed = POSTING_CALENDAR.flatMap((slot, index) => findHardCodedNumbers(slot.hook, `${index}.hook`))
    expect(typed).toEqual([])
  })
  it("names every scheduled asset in words, with no fallback", () => {
    // The launch kit prints these, so a missing label would ship as a slug.
    // A missing label falls back to the raw folder name, which must never ship.
    const unnamed = POSTING_CALENDAR.filter((slot) => {
      const label = assetRefLabel(slot.asset)
      const raw = slot.asset.kind === "social" ? slot.asset.id : slot.asset.group
      return label.includes(raw) || !/^[A-Z]/.test(label)
    }).map((slot) => assetRefLabel(slot.asset))
    expect(unnamed).toEqual([])
    const labels = POSTING_CALENDAR.map((slot) => assetRefLabel(slot.asset))
    expect(new Set(labels).size, "each asset reads as its own thing").toBe(labels.length)
  })

  it("writes each slot's date the way the kit prints it", () => {
    expect(slotWhen(POSTING_CALENDAR[0])).toBe("Tue 13 Oct")
    const last = POSTING_CALENDAR.at(-1)
    expect(last && slotWhen(last)).toBe("Fri 6 Nov")
  })
  it("gives every carousel on a channel that cannot take a PDF a support still", () => {
    // The delivery note tells these channels to attach a still. It must exist.
    const missing = POSTING_CALENDAR.filter(
      (slot) => slotFormat(slot) === "carousel" && !takesPdf(slot.channel) && !slot.support,
    ).map((slot) => `${slot.channel} ${slotDate(slot)} ${assetRefLabel(slot.asset)}`)
    expect(missing).toEqual([])
  })

  it("knows which channels take a PDF at all", () => {
    expect(CHANNELS.filter(takesPdf).sort()).toEqual(["linkedin", "telegram"])
  })
})
