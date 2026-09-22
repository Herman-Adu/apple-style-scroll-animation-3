import type { Doc } from "../schema"

export const gettingStartedWithYourDevice: Doc = {
  slug: "getting-started-with-your-device",
  title: "Getting Started With Your Momo Device",
  category: "Getting Started",
  audience: "user",
  access: "public",
  summary:
    "Unbox, charge, pair, and personalise your new headphones or earbuds in a few minutes.",
  readingMinutes: 5,
  order: 1,
  updatedAt: "2026-09-20",
  tags: ["setup", "pairing", "bluetooth", "first steps"],
  body: [
    {
      type: "paragraph",
      text: "Welcome to Momo Audio. This guide takes you from a sealed box to your first track in about five minutes. The steps are the same for our headphones and earbuds unless noted — where they differ, we call it out.",
    },
    {
      type: "heading",
      text: "What's in the box",
    },
    {
      type: "list",
      items: [
        "Your headphones or earbuds (earbuds arrive seated in their charging case)",
        "A USB-C charging cable",
        "For earbuds: three sizes of silicone ear tips (medium is pre-fitted)",
        "A protective travel case and a quick-start card",
      ],
    },
    {
      type: "heading",
      text: "Charge before first use",
    },
    {
      type: "paragraph",
      text: "Connect the USB-C cable to the headphones — or the earbuds' case — and to any standard charger. A pulsing light means charging; a steady light means full. A full charge takes roughly 90 minutes.",
    },
    {
      type: "callout",
      variant: "tip",
      text: "A short 10-minute top-up gives several hours of listening, which is plenty to finish setup and start listening today.",
    },
    {
      type: "heading",
      text: "Pair with your phone",
    },
    {
      type: "steps",
      items: [
        "Put the device into pairing mode: hold the power button (headphones) or open the case lid and hold the case button (earbuds) until the light blinks.",
        "On your phone, open Settings, then Bluetooth, and make sure Bluetooth is on.",
        "Tap your Momo device when it appears in the list of available devices.",
        "Wait for the confirmation tone — that means you're connected.",
      ],
    },
    {
      type: "paragraph",
      text: "The next time your device is on and nearby, it reconnects to that phone automatically. To use it with a second device, put it back into pairing mode and repeat the steps above.",
    },
    {
      type: "heading",
      text: "Personalise the sound",
    },
    {
      type: "paragraph",
      text: "Every Momo device sounds great out of the box, tuned to our reference standard. If you'd like to adjust the balance, the Momo companion app lets you fine-tune the equaliser, rename the device, and check the remaining battery at a glance. It's an optional step — your device works fully without it.",
    },
  ],
}
