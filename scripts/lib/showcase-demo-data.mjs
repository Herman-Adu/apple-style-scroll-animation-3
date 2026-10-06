// Pure demo data for the showcase recordings. No database access and no randomness,
// so the unit tests can pin it down. Every row carries a tag (id prefix, reserved
// .test email domain or DEMO- order number) so cleanup can remove exactly these rows.

export const DEMO_EMAIL_DOMAIN = "demo.momo-audio.test"
export const DEMO_ID_PREFIX = "demo_"
export const DEMO_ORDER_PREFIX = "DEMO-"
export const DEMO_PRESET_CATEGORY = "showcase"

export const SEEDED_MODELS = [
  "user",
  "order",
  "discountCode",
  "review",
  "messagePreset",
  "customerMessage",
  "campaign",
  "subscriber",
  "emailLog",
  "stockAlert",
]

/** People waiting per product. The buyer pack's stock-alert slide shows these exact counts. */
const WAITING_ALERTS = [
  ["momo-studio", 12],
  ["momo-x", 7],
  ["momo-beat", 4],
]

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const money = (value) => Math.round(value * 100) / 100
const email = (local) => `${local}@${DEMO_EMAIL_DOMAIN}`

const CATALOG = {
  "momo-x": { name: "MOMO X", unitAmount: 549 },
  "momo-air": { name: "MOMO Air", unitAmount: 249 },
  "momo-studio": { name: "MOMO Studio", unitAmount: 699 },
  "momo-beat": { name: "MOMO Beat", unitAmount: 349 },
}

const CUSTOMERS = [
  ["ava-chen", "Ava Chen"],
  ["noah-okafor", "Noah Okafor"],
  ["mia-rossi", "Mia Rossi"],
  ["liam-novak", "Liam Novak"],
  ["zara-hughes", "Zara Hughes"],
  ["ethan-park", "Ethan Park"],
  ["isla-moreau", "Isla Moreau"],
  ["omar-haddad", "Omar Haddad"],
]

const ageBefore = (now, days, hours = 0) => new Date(now.getTime() - days * DAY_MS - hours * HOUR_MS)

export function assertSeedTarget({ databaseUrl, confirmed }) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set, so there is nothing to seed.")
  let parsed
  try {
    parsed = new URL(databaseUrl)
  } catch {
    throw new Error("DATABASE_URL is not a valid URL.")
  }
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    throw new Error("DATABASE_URL must be a postgres connection string.")
  }
  if (!confirmed) {
    throw new Error(`Refusing to write to ${parsed.hostname} without --confirm.`)
  }
  return { host: parsed.hostname }
}

export function isDemoRow({ id, email: address, number } = {}) {
  return (
    (typeof id === "string" && id.startsWith(DEMO_ID_PREFIX)) ||
    (typeof address === "string" && address.endsWith(`@${DEMO_EMAIL_DOMAIN}`)) ||
    (typeof number === "string" && number.startsWith(DEMO_ORDER_PREFIX))
  )
}

export function buildCleanupPlan() {
  const demoId = { startsWith: DEMO_ID_PREFIX }
  const demoEmail = { endsWith: `@${DEMO_EMAIL_DOMAIN}` }
  return [
    { model: "order", where: { id: demoId, number: { startsWith: DEMO_ORDER_PREFIX } } },
    { model: "review", where: { id: demoId } },
    { model: "customerMessage", where: { customerEmail: demoEmail } },
    { model: "emailLog", where: { to: demoEmail } },
    { model: "campaign", where: { stats: { path: ["demo"], equals: true } } },
    { model: "subscriber", where: { email: demoEmail } },
    { model: "stockAlert", where: { email: demoEmail } },
    { model: "messagePreset", where: { category: DEMO_PRESET_CATEGORY } },
    { model: "discountCode", where: { id: demoId } },
    { model: "user", where: { id: demoId, email: demoEmail } },
  ]
}

function buildUsers(now) {
  const offers = {
    "ava-chen": [
      { id: "demo_offer_welcome", label: "Welcome offer", kind: "percent", value: 10, note: "Thanks for joining" },
    ],
    "zara-hughes": [
      { id: "demo_offer_vip", label: "VIP early access", kind: "percent", value: 25, note: "Launch-week VIP" },
      { id: "demo_offer_ship", label: "Free delivery", kind: "shipping" },
    ],
    "omar-haddad": [{ id: "demo_offer_custom", label: "Priority support", kind: "custom", note: "Direct line" }],
  }
  return CUSTOMERS.map(([local, name], index) => ({
    id: `${DEMO_ID_PREFIX}user_${local}`,
    name,
    email: email(local),
    role: "customer",
    emailVerified: true,
    createdAt: ageBefore(now, 40 - index * 3),
    offers: (offers[local] ?? []).map((offer, i) => ({
      ...offer,
      createdAt: ageBefore(now, 6 - i).toISOString(),
    })),
  }))
}

function buildDiscountCodes(now) {
  return [
    { id: "demo_code_launch20", code: "LAUNCH20", label: "Launch week 20% off", kind: "percent", value: 20, active: true, expiresAt: null, minSubtotal: null, maxRedemptions: null },
    { id: "demo_code_vip25", code: "VIP25", label: "VIP 25% off", kind: "percent", value: 25, active: true, expiresAt: null, minSubtotal: 500, maxRedemptions: 25 },
    { id: "demo_code_welcome10", code: "WELCOME10", label: "Welcome 10% off (first 3)", kind: "percent", value: 10, active: true, expiresAt: null, minSubtotal: null, maxRedemptions: 3 },
    { id: "demo_code_spring15", code: "SPRING15", label: "Spring sale 15% off", kind: "percent", value: 15, active: true, expiresAt: ageBefore(now, 9), minSubtotal: null, maxRedemptions: null },
    { id: "demo_code_freeship", code: "FREESHIP", label: "Free shipping", kind: "shipping", value: null, active: true, expiresAt: null, minSubtotal: null, maxRedemptions: null },
  ].map((code) => ({ ...code, createdAt: ageBefore(now, 30) }))
}

// [customer index, days ago, hours, [[slug, qty]...], code, status]
const ORDER_PLAN = [
  [0, 25, 3, [["momo-x", 1]], "LAUNCH20", "fulfilled"],
  [1, 22, 5, [["momo-air", 2]], "WELCOME10", "fulfilled"],
  [2, 20, 2, [["momo-studio", 1]], "SPRING15", "fulfilled"],
  [3, 17, 8, [["momo-beat", 1], ["momo-air", 1]], "WELCOME10", "fulfilled"],
  [4, 14, 4, [["momo-x", 1], ["momo-beat", 1]], "SPRING15", "refunded"],
  [5, 11, 6, [["momo-studio", 1]], "WELCOME10", "fulfilled"],
  [6, 9, 1, [["momo-air", 1]], undefined, "cancelled"],
  [7, 7, 7, [["momo-x", 2]], "LAUNCH20", "fulfilled"],
  [0, 4, 3, [["momo-beat", 2]], "LAUNCH20", "fulfilled"],
  [4, 2, 5, [["momo-studio", 1], ["momo-air", 1]], "VIP25", "processing"],
  [1, 1, 2, [["momo-x", 1]], undefined, "processing"],
  [2, 0, 4, [["momo-beat", 1]], "LAUNCH20", "processing"],
]

function buildOrders(now, users, codes) {
  const carriers = ["ups", "fedex", "dhl"]
  return ORDER_PLAN.map(([userIndex, days, hours, lines, code, status], index) => {
    const user = users[userIndex]
    const items = lines.map(([slug, quantity]) => ({
      slug,
      name: CATALOG[slug].name,
      quantity,
      unitAmount: CATALOG[slug].unitAmount,
      currency: "USD",
    }))
    const subtotal = money(items.reduce((sum, item) => sum + item.unitAmount * item.quantity, 0))
    const percent = code ? codes.find((c) => c.code === code).value : 0
    const discount = money((subtotal * percent) / 100)
    const total = money(Math.max(0, subtotal - discount))
    const createdAt = ageBefore(now, days, hours)
    const order = {
      id: `${DEMO_ID_PREFIX}order_${1001 + index}`,
      number: `${DEMO_ORDER_PREFIX}${1001 + index}`,
      userId: user.id,
      email: user.email,
      status,
      items,
      subtotal,
      shipping: 0,
      discount,
      discountCode: code,
      appliedOffers: code
        ? [{ id: `code-${code}`, label: code, kind: "percent", amount: discount }]
        : [],
      total,
      currency: "USD",
      stripeSessionId: null,
      stripePaymentIntentId: null,
      refundedAmount: 0,
      refunds: [],
      createdAt,
    }
    if (status === "fulfilled") {
      order.carrier = carriers[index % carriers.length]
      order.trackingNumber = `DEMO${String(7000 + index)}TRK`
      order.shippedAt = new Date(createdAt.getTime() + DAY_MS)
    }
    if (status === "refunded") {
      order.refundedAmount = total
      order.refunds = [
        {
          id: `${DEMO_ID_PREFIX}refund_${1001 + index}`,
          amount: total,
          currency: "USD",
          reason: "requested_by_customer",
          createdAt: new Date(createdAt.getTime() + 2 * DAY_MS).toISOString(),
        },
      ]
    }
    return order
  })
}

function buildReviews(now, users) {
  const rows = [
    [0, "momo-x", 5, "Worth every penny", "The noise cancelling is the best I have used on a long flight."],
    [1, "momo-air", 5, "Light and comfortable", "I forget I am wearing them after an hour."],
    [2, "momo-studio", 4, "Superb for mixing", "Flat and honest. The case could be smaller."],
    [3, "momo-beat", 5, "Great for the gym", "Stays put and the battery just keeps going."],
    [5, "momo-x", 4, "Clean, balanced sound", "Setup took a minute and the app is simple."],
  ]
  return rows.map(([userIndex, productSlug, rating, headline, body], index) => ({
    id: `${DEMO_ID_PREFIX}review_${index + 1}`,
    productSlug,
    authorId: users[userIndex].id,
    author: users[userIndex].name,
    rating,
    headline,
    body,
    status: "published",
    source: "user",
    createdAt: ageBefore(now, 18 - index * 3),
  }))
}

function buildEmail(now, users, orders) {
  const subscribers = users.map((user, index) => ({
    email: user.email,
    name: user.name,
    optedIn: index !== 3 && index !== 6,
    source: index % 2 === 0 ? "storefront" : "checkout",
    createdAt: ageBefore(now, 35 - index * 2),
  }))
  const everyone = users.map((user) => user.email)
  const audience = (emails) => ({ type: "manual", emails })
  const campaigns = [
    {
      name: "Launch week: 20% off",
      templateKey: "personal_offer",
      subject: "Launch week: 20% off the MOMO range",
      previewText: "Use LAUNCH20 at checkout before the week ends.",
      audience: audience(everyone.slice(0, 6)),
      status: "sent",
      stats: { demo: true, recipients: 6, sent: 5, failed: 0, skipped: 1 },
      sentAt: ageBefore(now, 8),
      scheduledAt: null,
    },
    {
      name: "Welcome series: first order",
      templateKey: "welcome",
      subject: "Welcome to MOMO Audio",
      previewText: "A quick tour of what is waiting for you.",
      audience: audience(everyone.slice(4, 8)),
      status: "scheduled",
      stats: { demo: true },
      sentAt: null,
      scheduledAt: new Date(now.getTime() + 7 * DAY_MS),
    },
    {
      name: "Shipping update template check",
      templateKey: "shipping_update",
      subject: "Your MOMO order is on its way",
      previewText: "Track your parcel in one tap.",
      audience: audience(everyone.slice(0, 3)),
      status: "draft",
      stats: { demo: true },
      sentAt: null,
      scheduledAt: null,
    },
  ]
  const orderLogs = orders.map((order) => ({
    to: order.email,
    subject: `Order ${order.number} confirmed`,
    templateKey: "order_confirmation",
    type: "transactional",
    relatedId: order.number,
    status: "sent",
    createdAt: order.createdAt,
  }))
  const sent = campaigns[0]
  const campaignLogs = sent.audience.emails.map((to, index) => ({
    to,
    subject: sent.subject,
    templateKey: sent.templateKey,
    type: "campaign",
    relatedId: sent.name,
    status: index === 3 ? "skipped" : "sent",
    createdAt: sent.sentAt,
  }))
  return { subscribers, campaigns, emailLogs: [...orderLogs, ...campaignLogs] }
}

function buildMessages(now, users) {
  const messagePresets = [
    ["Order on its way", "shipping", "Your order is on its way", "Hi {{customer_name}}, your order {{order_number}} has shipped. Tracking is in your account."],
    ["Thanks for your review", "general", "Thank you for your feedback", "Hi {{customer_name}}, thanks for taking the time to review your purchase."],
    ["Refund processed", "support", "Your refund is on its way", "Hi {{customer_name}}, we have refunded {{total}}. It can take a few days to appear."],
    ["Personal offer", "marketing", "A little something for you", "Hi {{customer_name}}, here is {{offer_headline}} on your next order."],
  ].map(([name, , subject, body]) => ({ name, category: DEMO_PRESET_CATEGORY, subject, body }))
  const customerMessages = [
    [0, "Your order is on its way", "Hi Ava, your order has shipped. Tracking is in your account."],
    [4, "Your refund is on its way", "Hi Zara, we have refunded your order. It can take a few days to appear."],
    [7, "A little something for you", "Hi Omar, here is 20% off your next order."],
  ].map(([userIndex, subject, body], index) => ({
    customerEmail: users[userIndex].email,
    customerName: users[userIndex].name,
    subject,
    body,
    status: "sent",
    createdAt: ageBefore(now, 6 - index * 2),
  }))
  return { messagePresets, customerMessages }
}

function buildStockAlerts(now) {
  return WAITING_ALERTS.flatMap(([slug, count]) =>
    Array.from({ length: count }, (_, index) => ({
      email: email(`waiting-${slug}-${index + 1}`),
      productSlug: slug,
      token: `${DEMO_ID_PREFIX}alert_${slug}_${index + 1}`,
      createdAt: ageBefore(now, index % 14, index),
      notifiedAt: null,
    })),
  )
}

export function buildDemoData(now = new Date()) {
  const users = buildUsers(now)
  const rawCodes = buildDiscountCodes(now)
  const orders = buildOrders(now, users, rawCodes)
  const discountCodes = rawCodes.map((code) => ({
    ...code,
    redemptionCount: orders.filter((order) => order.discountCode === code.code).length,
  }))
  return {
    users,
    orders,
    discountCodes,
    reviews: buildReviews(now, users),
    ...buildEmail(now, users, orders),
    ...buildMessages(now, users),
    stockAlerts: buildStockAlerts(now),
  }
}
