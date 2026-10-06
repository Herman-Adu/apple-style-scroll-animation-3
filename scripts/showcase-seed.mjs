// Seeds (or removes) neutral demo data for the showcase recordings.
//
//   pnpm showcase:seed -- --dry-run          reads only: counts, host, collisions
//   pnpm showcase:seed -- --confirm          replaces any earlier demo rows, then inserts fresh ones
//   pnpm showcase:unseed -- --confirm        removes demo rows and nothing else
//
// Only rows tagged as demo are ever written or deleted (see showcase-demo-data.mjs).
import { PrismaClient } from "@prisma/client"
import {
  DEMO_ID_PREFIX,
  assertSeedTarget,
  buildCleanupPlan,
  buildDemoData,
} from "./lib/showcase-demo-data.mjs"

const args = new Set(process.argv.slice(2))
const dryRun = args.has("--dry-run")
const cleanOnly = args.has("--clean")

const databaseUrl = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL
let target
try {
  target = assertSeedTarget({ databaseUrl, confirmed: dryRun || args.has("--confirm") })
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

const prisma = new PrismaClient()
const data = buildDemoData(new Date())

async function findProblems() {
  const problems = []
  const codes = data.discountCodes.map((c) => c.code)
  const clashes = await prisma.discountCode.findMany({
    where: { code: { in: codes }, NOT: { id: { startsWith: DEMO_ID_PREFIX } } },
    select: { code: true },
  })
  for (const { code } of clashes) problems.push(`A real discount code named ${code} already exists.`)

  const keys = [...new Set(data.campaigns.map((c) => c.templateKey))]
  const templates = await prisma.emailTemplate.findMany({ where: { key: { in: keys } }, select: { key: true } })
  for (const key of keys) {
    if (!templates.some((t) => t.key === key)) problems.push(`Email template "${key}" does not exist.`)
  }
  return problems
}

async function removeDemoRows(tx) {
  const removed = {}
  for (const { model, where } of buildCleanupPlan()) {
    const { count } = await tx[model].deleteMany({ where })
    removed[model] = count
  }
  return removed
}

async function insertDemoRows(tx) {
  const templates = await tx.emailTemplate.findMany({ select: { id: true, key: true } })
  const templateId = (key) => templates.find((t) => t.key === key)?.id ?? null

  await tx.user.createMany({
    data: data.users.map(({ id, name, email, role, emailVerified, createdAt, offers }) => ({
      id, name, email, role, emailVerified, createdAt, offers,
    })),
  })
  await tx.discountCode.createMany({ data: data.discountCodes })
  await tx.order.createMany({
    data: data.orders.map((order) => ({ ...order, discountCode: order.discountCode ?? null })),
  })
  await tx.review.createMany({ data: data.reviews })
  await tx.subscriber.createMany({ data: data.subscribers })
  await tx.messagePreset.createMany({ data: data.messagePresets })
  await tx.customerMessage.createMany({ data: data.customerMessages })
  await tx.emailLog.createMany({ data: data.emailLogs })
  for (const { templateKey, ...campaign } of data.campaigns) {
    await tx.campaign.create({ data: { ...campaign, templateId: templateId(templateKey) } })
  }
}

const counts = Object.fromEntries(
  ["users", "orders", "discountCodes", "reviews", "subscribers", "campaigns", "messagePresets", "customerMessages", "emailLogs"].map(
    (key) => [key, data[key].length],
  ),
)

try {
  console.log(`Target database host: ${target.host}`)
  const problems = cleanOnly ? [] : await findProblems()
  if (problems.length > 0) {
    console.error(["Cannot seed:", ...problems.map((p) => `  - ${p}`)].join("\n"))
    process.exitCode = 1
  } else if (dryRun) {
    console.log("Dry run, nothing written. Would seed:", counts)
  } else if (cleanOnly) {
    console.log("Removed demo rows:", await prisma.$transaction(removeDemoRows, { timeout: 60000 }))
  } else {
    await prisma.$transaction(
      async (tx) => {
        await removeDemoRows(tx)
        await insertDemoRows(tx)
      },
      { timeout: 60000 },
    )
    console.log("Seeded demo rows:", counts)
  }
} finally {
  await prisma.$disconnect()
}
