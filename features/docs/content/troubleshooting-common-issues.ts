import type { Doc } from "../schema"

export const troubleshootingCommonIssues: Doc = {
  slug: "troubleshooting-common-issues",
  title: "Troubleshooting Common Issues",
  category: "Troubleshooting",
  audience: "user",
  access: "public",
  summary:
    "Quick fixes for pairing drops, one side going silent, charging problems, and how to factory reset.",
  readingMinutes: 6,
  order: 3,
  updatedAt: "2026-09-20",
  tags: ["troubleshooting", "reset", "bluetooth", "charging", "support"],
  body: [
    {
      type: "paragraph",
      text: "Most issues clear up in under a minute. Find your symptom below, try the fix, and if it persists the reset steps further down resolve the large majority of remaining cases.",
    },
    {
      type: "heading",
      text: "Common symptoms and fixes",
    },
    {
      type: "table",
      headers: ["Symptom", "Try this first"],
      rows: [
        ["Won't connect", "Turn Bluetooth off and on, then re-select the device. Make sure it isn't still connected to another phone or laptop nearby."],
        ["Audio keeps cutting out", "Move your phone closer and clear line of sight. Interference from other wireless devices is the usual cause."],
        ["Only one side plays", "For earbuds, return both to the case for five seconds, then take them out together. Check the volume balance in your phone's accessibility settings."],
        ["Won't charge", "Try a different cable and charger, and clean the USB-C port and contacts. Let a fully drained battery sit on the charger for a few minutes before expecting a light."],
        ["Low volume or muffled", "Clean the earbud mesh and check for a worn ear-tip seal. Confirm no volume limit is set on your phone."],
      ],
    },
    {
      type: "heading",
      text: "Factory reset",
    },
    {
      type: "paragraph",
      text: "A reset clears saved connections and returns the device to its out-of-box state. Use it when connection problems persist after the fixes above.",
    },
    {
      type: "steps",
      items: [
        "On your phone, open Bluetooth settings and choose 'Forget' for your Momo device.",
        "Place earbuds in the case with the lid open, or power on the headphones.",
        "Hold the button (case button for earbuds, power button for headphones) for about 10 seconds until the light flashes twice.",
        "Release, then pair again from scratch using the Getting Started steps.",
      ],
    },
    {
      type: "callout",
      variant: "warning",
      text: "A reset removes all paired devices. You'll need to pair each phone or laptop again afterwards.",
    },
    {
      type: "heading",
      text: "Still stuck?",
    },
    {
      type: "paragraph",
      text: "If none of the above helps, reach out through the Contact page with your device model and a short description of what you've tried — it helps us get you to a fix faster.",
    },
  ],
}
