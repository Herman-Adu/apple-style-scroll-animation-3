import { beforeEach, describe, expect, it, vi } from "vitest"
import type { EmailBlock } from "@/features/email/blocks/types"
import { fakeAuth, fakeCache, fakeDb, fakeEmail } from "@/qa/fakes"

/**
 * The server actions are the authoritative lock check: even if the proxy or
 * the editor UI were bypassed, an admin who isn't allowed to lock can't change
 * a locked block, and a non-admin can't call the actions at all. Prisma and the
 * session are replaced with in-memory stand-ins; the permission rules are real.
 */
type Row = Record<string, unknown> & { id: number; version: number; blocks: EmailBlock[] }

let templates: Map<number, Row>
const LOCKERS = ["designer@adudev.co.uk"]

const tpl = {
  findUnique: vi.fn(async ({ where }: { where: { id: number } }) => templates.get(where.id) ?? null),
  update: vi.fn(async ({ where, data }: { where: { id: number }; data: Record<string, unknown> }) => {
    const cur = templates.get(where.id)!
    const { version: _inc, ...rest } = data
    const next = { ...cur, ...rest, version: cur.version + 1, updatedAt: new Date() } as Row
    templates.set(where.id, next)
    return next
  }),
}
const ver = {
  count: vi.fn(async () => 1),
  upsert: vi.fn(async ({ create }: { create: Row }) => create),
  findMany: vi.fn(async () => []),
  findUnique: vi.fn(async () => null),
  deleteMany: vi.fn(async () => ({ count: 0 })),
}

const auth = fakeAuth({ lockers: LOCKERS })
fakeDb({ emailTemplate: tpl, emailTemplateVersion: ver }).install()
fakeCache().install()
fakeEmail().install()
auth.install()
vi.mock("@/lib/settings/db-actions", () => ({ getStoreSettingsAction: vi.fn() }))

const header: EmailBlock = { id: "header", type: "heading", text: "Brand", align: "center", locked: true }
const body: EmailBlock = { id: "body", type: "text", text: "Hello", align: "left" }

const seed = () =>
  templates.set(1, {
    id: 1,
    key: "tpl_x",
    isSystem: false,
    name: "Promo",
    category: "marketing",
    subject: "Hi",
    previewText: "",
    description: "",
    blocks: [header, body],
    version: 1,
  })

const blocksOf = (id: number) => templates.get(id)!.blocks

beforeEach(() => {
  vi.clearAllMocks()
  templates = new Map()
  seed()
})

async function actions() {
  return import("@/features/email/admin-actions")
}

describe("server actions require an admin", () => {
  it("rejects a signed-out caller", async () => {
    auth.session = null
    const { saveTemplateAction } = await actions()
    await expect(saveTemplateAction(1, { subject: "x" })).rejects.toThrow()
    expect(tpl.update).not.toHaveBeenCalled()
  })

  it("rejects a customer", async () => {
    auth.session = { email: "shopper@x.com", role: "customer" }
    const { saveTemplateAction } = await actions()
    await expect(saveTemplateAction(1, { subject: "x" })).rejects.toThrow()
    expect(tpl.update).not.toHaveBeenCalled()
  })
})

describe("admin who can't lock", () => {
  beforeEach(() => {
    auth.session = { email: "content@adudev.co.uk", role: "admin" }
  })

  it("can edit unlocked blocks and other fields", async () => {
    const { saveTemplateAction } = await actions()
    const res = await saveTemplateAction(1, { subject: "New", blocks: [header, { ...body, text: "Changed" } as EmailBlock] })
    expect(res.ok).toBe(true)
    expect((blocksOf(1)[1] as { text: string }).text).toBe("Changed")
  })

  it("can't edit a locked block", async () => {
    const { saveTemplateAction } = await actions()
    const res = await saveTemplateAction(1, { blocks: [{ ...header, text: "Hacked" } as EmailBlock, body] })
    expect(res.ok).toBe(false)
    expect(tpl.update).not.toHaveBeenCalled()
  })

  it("can't unlock, remove or add locks", async () => {
    const { saveTemplateAction } = await actions()
    const attempts: EmailBlock[][] = [
      [{ ...header, locked: false } as EmailBlock, body],
      [body],
      [header, { ...body, locked: true } as EmailBlock],
    ]
    for (const blocks of attempts) expect((await saveTemplateAction(1, { blocks })).ok).toBe(false)
    expect(tpl.update).not.toHaveBeenCalled()
  })

  it("can't reset or restore a template that has locked blocks", async () => {
    const { resetTemplateAction, restoreTemplateVersionAction } = await actions()
    expect((await resetTemplateAction(1)).ok).toBe(false)
    expect((await restoreTemplateVersionAction(1, 5)).ok).toBe(false)
    expect(tpl.update).not.toHaveBeenCalled()
  })
})

describe("admins who can lock", () => {
  it("the owner can unlock and edit", async () => {
    auth.session = { email: "herman@adudev.co.uk", role: "admin" }
    const { saveTemplateAction } = await actions()
    const res = await saveTemplateAction(1, { blocks: [{ ...header, locked: false, text: "New brand" } as EmailBlock, body] })
    expect(res.ok).toBe(true)
    expect(blocksOf(1)[0].locked).toBe(false)
  })

  it("a listed admin can lock a new block", async () => {
    auth.session = { email: "designer@adudev.co.uk", role: "admin" }
    const { saveTemplateAction } = await actions()
    const res = await saveTemplateAction(1, { blocks: [header, { ...body, locked: true } as EmailBlock] })
    expect(res.ok).toBe(true)
    expect(blocksOf(1)[1].locked).toBe(true)
  })
})
