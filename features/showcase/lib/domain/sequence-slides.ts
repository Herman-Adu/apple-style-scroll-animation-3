import type { SocialAsset } from "./social-assets"

/** Checkout told one step per swipe. Every claim matches the checkout action and the Stripe webhook route. */
export const CHECKOUT_STEPS = [
  {
    name: "Customer pays",
    title: "The customer presses Pay.",
    body: "The browser sends only which products and how many. It never tells the server what anything costs.",
  },
  {
    name: "Total re-checked",
    title: "The server works out the total itself.",
    body: "The total is recomputed on the server from catalogue prices, so an edited cart cannot pay less.",
  },
  {
    name: "Stripe charges once",
    title: "Stripe charges exactly once.",
    body: "Each payment carries an idempotency key, so a retry or a double click cannot charge the card twice.",
  },
  {
    name: "Order saved",
    title: "The order is saved only when Stripe confirms.",
    body: "The webhook signature is verified before the order is marked paid. A forged request is turned away.",
  },
  {
    name: "Email sent",
    title: "The confirmation email arrives.",
    body: "Resend sends the order email from the saved order, so the receipt matches exactly what was paid.",
  },
] as const

const stepNames = CHECKOUT_STEPS.map((s) => s.name)

export const sequenceSlides: SocialAsset[] = [
  {
    id: "sequence-checkout-cover",
    format: "carousel",
    role: "cover",
    pack: "sequence",
    eyebrow: "Checkout, step by step",
    title: "What happens when you press Pay.",
    body: "Five steps between a click and a receipt. Swipe through each one.",
    progress: { steps: [...stepNames], current: -1 },
  },
  ...CHECKOUT_STEPS.map((step, current) => ({
    id: `sequence-checkout-${current + 1}`,
    format: "carousel" as const,
    pack: "sequence" as const,
    eyebrow: `Step ${current + 1} of ${CHECKOUT_STEPS.length}`,
    title: step.title,
    body: step.body,
    progress: { steps: [...stepNames], current },
  })),
]
