import { expect, test } from "./fixtures"
import { beat, clearCaption, saveClip, showCaption } from "./clip"
import {
  ENQUIRY_CLIP_ANSWERS,
  ENQUIRY_CLIP_SENDER,
  ENQUIRY_CLIP_TYPES,
  ENQUIRY_SUBMIT_LABEL,
  getClip,
} from "./shot-list"

/**
 * Clip 10, the enquiry form: the topic picker, then the same form filled in for
 * two different topics so the fields visibly change.
 *
 * The clip stops on the review step and never clicks "Send message". Submitting
 * sends a real email through Resend to the owner's inbox, and this spec runs
 * once per recording format on every take. A unit test in
 * qa/unit/showcase/shot-list.test.ts fails if any click here touches that button.
 */
const [general, wholesale] = ENQUIRY_CLIP_TYPES

const TOPIC_LABELS: Record<string, RegExp> = {
  general: /General enquiry/,
  wholesale: /Wholesale & partnership/,
}

test("clip: the enquiry form", async ({ page }) => {
  const [introCaption, generalCaption, wholesaleCaption, reviewCaption] = getClip("enquiry").captions
  const continueButton = page.getByRole("button", { name: /^Continue$/ })
  const backButton = page.getByRole("button", { name: /^Back$/ })

  async function chooseTopic(type: string) {
    await page.getByRole("button", { name: TOPIC_LABELS[type] }).click()
    await beat(page, 1400)
    await continueButton.click()
  }

  async function fillDetails(type: keyof typeof ENQUIRY_CLIP_ANSWERS) {
    for (const [field, answer] of Object.entries(ENQUIRY_CLIP_ANSWERS[type])) {
      await page.locator(`#field-${field}`).pressSequentially(answer, { delay: 8 })
      await beat(page, 400)
    }
    await beat(page, 900)
    await continueButton.click()
  }

  await page.goto("/contact", { waitUntil: "networkidle" })
  await beat(page, 1200)
  await page.locator("#enquiry").scrollIntoViewIfNeeded()
  await showCaption(page, introCaption)
  await beat(page, 2400)
  await clearCaption(page)

  // A general enquiry, from the picker through to the review step.
  await chooseTopic(general)
  await page.locator("#contact-name").pressSequentially(ENQUIRY_CLIP_SENDER.name, { delay: 30 })
  await page.locator("#contact-email").pressSequentially(ENQUIRY_CLIP_SENDER.email, { delay: 18 })
  await beat(page, 800)
  await continueButton.click()

  await showCaption(page, generalCaption)
  await fillDetails(general)
  await beat(page, 1800)
  await clearCaption(page)

  // Back to the picker, where a different topic asks for different things.
  for (let step = 0; step < 3; step++) {
    await backButton.click()
    await beat(page, 500)
  }
  await showCaption(page, wholesaleCaption)
  await chooseTopic(wholesale)
  // Name and email survived the topic change, so the details step is a pass-through.
  await continueButton.click()
  await beat(page, 1600)
  await clearCaption(page)
  await fillDetails(wholesale)

  // The review step. The form is ready to send; the recording leaves it there.
  await showCaption(page, reviewCaption)
  await expect(page.getByRole("button", { name: ENQUIRY_SUBMIT_LABEL })).toBeVisible()
  await beat(page, 3000)
  await clearCaption(page)

  await saveClip(page, "enquiry")
})
