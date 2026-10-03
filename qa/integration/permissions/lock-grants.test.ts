import { beforeEach, describe, expect, it, vi } from "vitest"
import { fakeAuth, fakeCache, fakeDb } from "@/qa/fakes"

/**
 * The owner grants and revokes lock rights from the admin UI. These actions are
 * the authoritative boundary: only the owner may call them, only admins can be
 * granted, the owner can't be revoked, and every change is audited. Prisma and
 * the session are in-memory stand-ins; the permission rules are real.
 */
const OWNER = "herman@adudev.co.uk"

type Locker = { id: number; email: string; grantedBy: string; createdAt: Date }
type Audit = { id: number; action: string; permission: string; subjectEmail: string; actorEmail: string; createdAt: Date }

let lockers: Locker[]
let audit: Audit[]
const users = [
  { email: OWNER, role: "admin", roleOverride: null },
  { email: "designer@adudev.co.uk", role: "admin", roleOverride: null },
  { email: "content@adudev.co.uk", role: "customer", roleOverride: "admin" },
  { email: "shopper@x.com", role: "customer", roleOverride: null },
]

const db = fakeDb({
  user: { findMany: vi.fn(async () => users) },
  blockLocker: {
    findMany: vi.fn(async () => lockers),
    create: vi.fn(async ({ data }: { data: { email: string; grantedBy: string } }) => {
      const row = { id: lockers.length + 1, createdAt: new Date(), ...data }
      lockers.push(row)
      return row
    }),
    delete: vi.fn(async ({ where }: { where: { email: string } }) => {
      lockers = lockers.filter((l) => l.email !== where.email)
      return {}
    }),
  },
  permissionAudit: {
    findMany: vi.fn(async () => [...audit].reverse()),
    create: vi.fn(async ({ data }: { data: Omit<Audit, "id" | "createdAt" | "permission"> }) => {
      const row = { id: audit.length + 1, createdAt: new Date(), permission: "email.lock", ...data }
      audit.push(row)
      return row
    }),
  },
})
const prisma = db.prisma
const auth = fakeAuth()

db.install()
fakeCache().install()
auth.install()

const actions = () => import("@/features/admin/lib/permissions/actions")

beforeEach(() => {
  vi.clearAllMocks()
  lockers = []
  audit = []
  auth.session = { email: OWNER, role: "admin" }
})

describe("only the owner can manage lock rights", () => {
  it.each([
    ["signed out", null],
    ["a customer", { email: "shopper@x.com", role: "customer" as const }],
    ["another admin", { email: "designer@adudev.co.uk", role: "admin" as const }],
  ])("refuses %s", async (_label, who) => {
    auth.session = who
    const { grantLockRightsAction, revokeLockRightsAction, getLockPermissionsAction } = await actions()
    await expect(grantLockRightsAction("designer@adudev.co.uk")).rejects.toThrow()
    await expect(revokeLockRightsAction("designer@adudev.co.uk")).rejects.toThrow()
    await expect(getLockPermissionsAction()).rejects.toThrow()
    expect(prisma.blockLocker.create).not.toHaveBeenCalled()
  })
})

describe("grant", () => {
  it("grants an admin and writes an audit row in the same transaction", async () => {
    const { grantLockRightsAction } = await actions()
    expect(await grantLockRightsAction("Designer@AduDev.co.uk")).toEqual({ ok: true })
    expect(lockers.map((l) => l.email)).toEqual(["designer@adudev.co.uk"])
    expect(lockers[0].grantedBy).toBe(OWNER)
    expect(audit).toMatchObject([{ action: "grant", subjectEmail: "designer@adudev.co.uk", actorEmail: OWNER }])
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })

  it("treats a roleOverride admin as an admin", async () => {
    const { grantLockRightsAction } = await actions()
    expect((await grantLockRightsAction("content@adudev.co.uk")).ok).toBe(true)
  })

  it("refuses a non-admin, a duplicate and the owner without writing", async () => {
    const { grantLockRightsAction } = await actions()
    expect(await grantLockRightsAction("shopper@x.com")).toEqual({ ok: false, error: "Only admins can be given lock rights." })
    expect((await grantLockRightsAction(OWNER)).ok).toBe(false)
    await grantLockRightsAction("designer@adudev.co.uk")
    expect((await grantLockRightsAction("designer@adudev.co.uk")).ok).toBe(false)
    expect(prisma.blockLocker.create).toHaveBeenCalledTimes(1)
    expect(audit).toHaveLength(1)
  })
})

describe("revoke", () => {
  it("revokes a locker and audits it", async () => {
    const { grantLockRightsAction, revokeLockRightsAction } = await actions()
    await grantLockRightsAction("designer@adudev.co.uk")
    expect(await revokeLockRightsAction("designer@adudev.co.uk")).toEqual({ ok: true })
    expect(lockers).toEqual([])
    expect(audit.map((a) => a.action)).toEqual(["grant", "revoke"])
  })

  it("refuses to revoke the owner or a non-locker", async () => {
    const { revokeLockRightsAction } = await actions()
    expect((await revokeLockRightsAction(OWNER)).ok).toBe(false)
    expect((await revokeLockRightsAction("designer@adudev.co.uk")).ok).toBe(false)
    expect(prisma.blockLocker.delete).not.toHaveBeenCalled()
  })
})

describe("list", () => {
  it("lists admins only, with the owner first and pinned, plus the audit log", async () => {
    const { grantLockRightsAction, getLockPermissionsAction } = await actions()
    await grantLockRightsAction("designer@adudev.co.uk")
    const view = await getLockPermissionsAction()
    expect(view.admins).toEqual([
      { email: OWNER, isOwner: true, canLock: true, source: "owner" },
      { email: "content@adudev.co.uk", isOwner: false, canLock: false, source: null },
      { email: "designer@adudev.co.uk", isOwner: false, canLock: true, source: "granted" },
    ])
    expect(view.audit).toHaveLength(1)
  })
})
