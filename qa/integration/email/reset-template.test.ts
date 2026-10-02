import { beforeEach, describe, expect, it, vi } from "vitest"
import { SYSTEM_TEMPLATES } from "@/features/email/blocks/system-templates"
import { fakeAuth, fakeCache, fakeDb, fakeEmail } from "@/qa/fakes"

/**
 * Reset and restore are what content managers reach for after a messy
 * drag-and-drop session. System templates reset to their code default, custom
 * templates to their original version, and every change is snapshotted so it
 * can be undone. Prisma is replaced with an in-memory stand-in.
 */
type Row = Record<string, unknown> & { id: number; version: number }
type VersionRec = Row & { templateId: number; reason: string; createdAt: Date }

let templates: Map<number, Row>
let versions: VersionRec[]
let nextVersionId: number
const cache = fakeCache()
const revalidatePath = cache.revalidatePath

const tpl = {
  findUnique: vi.fn(async ({ where }: { where: { id: number } }) => templates.get(where.id) ?? null),
  update: vi.fn(async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
    const cur = templates.get(where.id)!
    const { version: _inc, ...rest } = data
    const next = { ...cur, ...rest, version: cur.version + 1, updatedAt: new Date() }
    templates.set(where.id, next)
    return next
  }),
}

const ver = {
  count: vi.fn(async ({ where }: { where: { templateId: number } }) =>
    versions.filter((v) => v.templateId === where.templateId).length,
  ),
  upsert: vi.fn(
    async ({ where, create }: { where: { templateId_version: { templateId: number; version: number } }; create: Row }) => {
      const k = where.templateId_version
      const hit = versions.find((v) => v.templateId === k.templateId && v.version === k.version)
      if (hit) return hit
      const rec = { ...create, id: nextVersionId++, createdAt: new Date() } as VersionRec
      versions.push(rec)
      return rec
    },
  ),
  findMany: vi.fn(async ({ where }: { where: { templateId: number } }) =>
    versions.filter((v) => v.templateId === where.templateId).sort((a, b) => b.version - a.version),
  ),
  findUnique: vi.fn(async ({ where }: { where: { id: number } }) => versions.find((v) => v.id === where.id) ?? null),
  deleteMany: vi.fn(async ({ where }: { where: { id: { in: number[] } } }) => {
    versions = versions.filter((v) => !where.id.in.includes(v.id))
    return { count: 0 }
  }),
}

fakeDb({ emailTemplate: tpl, emailTemplateVersion: ver }).install()
cache.install()
fakeEmail().install()
fakeAuth({ session: { email: "herman@adudev.co.uk", role: "admin" } }).install()
vi.mock("@/lib/settings/db-actions", () => ({ getStoreSettingsAction: vi.fn() }))

const def = SYSTEM_TEMPLATES[0]

const row = (over: Record<string, unknown> = {}): Row => ({
  id: 7,
  key: def.key,
  name: "Edited name",
  category: def.category,
  subject: "Edited subject",
  previewText: "Edited preview",
  description: "",
  blocks: [{ id: "x", type: "divider" }],
  isSystem: true,
  version: 4,
  updatedAt: new Date(),
  ...over,
})

beforeEach(() => {
  templates = new Map()
  versions = []
  nextVersionId = 1
  revalidatePath.mockReset()
  tpl.update.mockClear()
})

describe("resetTemplateAction", () => {
  it("restores a system template to its code default and keeps the edited state in history", async () => {
    templates.set(7, row())
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    const res = await resetTemplateAction(7)

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.template.subject).toBe(def.subject)
    expect(res.template.blocks).toEqual(def.blocks)
    expect(versions.map((v) => [v.version, v.reason])).toEqual([
      [4, "baseline"],
      [5, "reset"],
    ])
    expect(versions[0].subject).toBe("Edited subject")
    expect(revalidatePath).toHaveBeenCalledWith("/admin/email/templates/7")
  })

  it("resets a custom template to its original version", async () => {
    templates.set(8, row({ id: 8, isSystem: false, key: "custom_promo", subject: "Latest", version: 3 }))
    versions.push(
      { ...row({ subject: "Original" }), id: 90, templateId: 8, version: 1, reason: "create", createdAt: new Date() },
      { ...row({ subject: "Latest" }), id: 91, templateId: 8, version: 3, reason: "save", createdAt: new Date() },
    )
    nextVersionId = 100
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    const res = await resetTemplateAction(8)

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.template.subject).toBe("Original")
    expect(templates.get(8)!.version).toBe(4)
    expect(versions.at(-1)!.reason).toBe("reset")
  })

  it("returns an error when the template does not exist", async () => {
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    expect((await resetTemplateAction(999)).ok).toBe(false)
  })
})

describe("restoreTemplateVersionAction", () => {
  it("makes an older version current as a new version", async () => {
    templates.set(8, row({ id: 8, isSystem: false, subject: "Now", version: 2 }))
    versions.push({ ...row({ subject: "Then" }), id: 50, templateId: 8, version: 1, reason: "create", createdAt: new Date() })
    nextVersionId = 60
    const { restoreTemplateVersionAction } = await import("@/features/email/admin-actions")
    const res = await restoreTemplateVersionAction(8, 50)

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.template.subject).toBe("Then")
    expect(templates.get(8)!.version).toBe(3)
    expect(versions.find((v) => v.version === 3)?.reason).toBe("restore")
  })

  it("refuses a version that belongs to another template", async () => {
    templates.set(8, row({ id: 8 }))
    versions.push({ ...row(), id: 50, templateId: 99, version: 1, reason: "create", createdAt: new Date() })
    const { restoreTemplateVersionAction } = await import("@/features/email/admin-actions")
    expect((await restoreTemplateVersionAction(8, 50)).ok).toBe(false)
    expect(tpl.update).not.toHaveBeenCalled()
  })
})
