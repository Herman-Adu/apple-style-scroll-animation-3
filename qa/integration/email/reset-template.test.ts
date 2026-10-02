import { beforeEach, describe, expect, it, vi } from "vitest"
import { SYSTEM_TEMPLATES } from "@/features/email/blocks/system-templates"

/**
 * Reset-to-default is the action content managers reach for after a messy
 * drag-and-drop session, so it must restore the code default exactly and must
 * never touch custom templates. Prisma is replaced with an in-memory stand-in.
 */
const findUnique = vi.fn()
const update = vi.fn()
const revalidatePath = vi.fn()

vi.mock("@/lib/db/prisma", () => ({
  prisma: { emailTemplate: { findUnique: (a: unknown) => findUnique(a), update: (a: unknown) => update(a) } },
}))
vi.mock("next/cache", () => ({ revalidatePath: (p: string) => revalidatePath(p) }))
vi.mock("@/lib/settings/db-actions", () => ({ getStoreSettingsAction: vi.fn() }))
vi.mock("@/features/email/provider", () => ({ sendEmail: vi.fn() }))

const def = SYSTEM_TEMPLATES[0]

const row = (over: Record<string, unknown> = {}) => ({
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

describe("resetTemplateAction", () => {
  beforeEach(() => {
    findUnique.mockReset()
    update.mockReset()
    revalidatePath.mockReset()
    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...row(), ...data, version: 5 }))
  })

  it("restores a system template to its code default", async () => {
    findUnique.mockResolvedValue(row())
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    const res = await resetTemplateAction(7)

    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.template.subject).toBe(def.subject)
    expect(res.template.name).toBe(def.name)
    expect(res.template.blocks).toEqual(def.blocks)
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: expect.objectContaining({ version: { increment: 1 } }) }),
    )
    expect(revalidatePath).toHaveBeenCalledWith("/admin/email/templates/7")
  })

  it("refuses to reset a custom template", async () => {
    findUnique.mockResolvedValue(row({ isSystem: false, key: "custom_promo" }))
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    const res = await resetTemplateAction(7)

    expect(res.ok).toBe(false)
    expect(update).not.toHaveBeenCalled()
  })

  it("returns an error when the template does not exist", async () => {
    findUnique.mockResolvedValue(null)
    const { resetTemplateAction } = await import("@/features/email/admin-actions")
    expect((await resetTemplateAction(999)).ok).toBe(false)
  })
})
