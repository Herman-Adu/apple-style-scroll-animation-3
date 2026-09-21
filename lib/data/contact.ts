import type { EnquiryType } from "@/lib/contact/types"

export interface DayHours {
  day: string
  short: string
  /** 24h "HH:MM" or null when closed. */
  open: string | null
  close: string | null
}

/** Ordered Monday-first to match the display and the local-time lookup. */
export const openingHours: DayHours[] = [
  { day: "Monday", short: "Mon", open: "09:00", close: "18:00" },
  { day: "Tuesday", short: "Tue", open: "09:00", close: "18:00" },
  { day: "Wednesday", short: "Wed", open: "09:00", close: "18:00" },
  { day: "Thursday", short: "Thu", open: "09:00", close: "18:00" },
  { day: "Friday", short: "Fri", open: "09:00", close: "17:00" },
  { day: "Saturday", short: "Sat", open: "10:00", close: "16:00" },
  { day: "Sunday", short: "Sun", open: null, close: null },
]

export interface ContactChannel {
  id: string
  icon: "mail" | "phone" | "pin"
  label: string
  value: string
  href: string
  note: string
}

export const contactChannels: ContactChannel[] = [
  {
    id: "email",
    icon: "mail",
    label: "Email",
    value: "hello@momoaudio.com",
    href: "mailto:hello@momoaudio.com",
    note: "We reply within one business day.",
  },
  {
    id: "phone",
    icon: "phone",
    label: "Phone",
    value: "+45 32 12 40 08",
    href: "tel:+4532124008",
    note: "Mon–Fri, during opening hours.",
  },
  {
    id: "studio",
    icon: "pin",
    label: "Copenhagen studio",
    value: "Refshalevej 163A, 1432",
    href: "https://maps.google.com/?q=Refshalevej+163A+Copenhagen",
    note: "Listening room by appointment.",
  },
]

export interface ContactLocation {
  city: string
  role: string
  timezone: string
  address: string
  lat: number
  lng: number
}

export const contactLocations: ContactLocation[] = [
  {
    city: "London",
    role: "Flagship store",
    timezone: "Europe/London",
    address: "18 Redchurch Street, Shoreditch, London E2 7DP",
    lat: 51.5241,
    lng: -0.0738,
  },
  {
    city: "Copenhagen",
    role: "Headquarters & studio",
    timezone: "Europe/Copenhagen",
    address: "Refshalevej 163A, 1432 København",
    lat: 55.6919,
    lng: 12.6108,
  },
  {
    city: "Accra",
    role: "Acoustics lab",
    timezone: "Africa/Accra",
    address: "5 Banana Street, Airport Residential Area, Accra",
    lat: 5.6037,
    lng: -0.1870,
  },
  {
    city: "Tokyo",
    role: "APAC support",
    timezone: "Asia/Tokyo",
    address: "2-11-3 Meguro, Meguro City, Tokyo",
    lat: 35.6329,
    lng: 139.7156,
  },
]

/**
 * Data-driven enquiry configuration. Add a type here and the multi-step form,
 * review step, and payload all update automatically.
 */
export const enquiryTypes: EnquiryType[] = [
  {
    id: "general",
    label: "General enquiry",
    description: "Questions about products, orders, or anything else.",
    icon: "message",
    fields: [
      { name: "subject", label: "Subject", type: "text", placeholder: "How can we help?", required: true },
      {
        name: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Tell us a little more…",
        required: true,
        full: true,
      },
    ],
  },
  {
    id: "support",
    label: "Product support",
    description: "Help with a device you already own.",
    icon: "lifebuoy",
    fields: [
      { name: "product", label: "Product", type: "select", optionsSource: "products", required: true },
      { name: "orderNumber", label: "Order number", type: "text", placeholder: "MOMO-XXXXXX" },
      {
        name: "issue",
        label: "What's happening?",
        type: "textarea",
        placeholder: "Describe the issue and any steps you've tried.",
        required: true,
        full: true,
      },
    ],
  },
  {
    id: "review",
    label: "Leave a review",
    description: "Share your experience with a Momo product.",
    icon: "star",
    fields: [
      { name: "product", label: "Which product?", type: "select", optionsSource: "products", required: true },
      { name: "rating", label: "Your rating", type: "rating", required: true, full: true },
      { name: "headline", label: "Headline", type: "text", placeholder: "Sum it up in a line", required: true },
      {
        name: "review",
        label: "Your review",
        type: "textarea",
        placeholder: "What did you love? What could be better?",
        required: true,
        full: true,
      },
    ],
  },
  {
    id: "wholesale",
    label: "Wholesale & partnership",
    description: "Stock Momo Audio or partner with us.",
    icon: "building",
    fields: [
      { name: "company", label: "Company", type: "text", placeholder: "Company name", required: true },
      { name: "country", label: "Country / region", type: "text", placeholder: "Where you operate", required: true },
      {
        name: "message",
        label: "About your business",
        type: "textarea",
        placeholder: "Tell us about your stores and the fit with Momo.",
        required: true,
        full: true,
      },
    ],
  },
  {
    id: "press",
    label: "Press & media",
    description: "Interviews, review units, and assets.",
    icon: "newspaper",
    fields: [
      { name: "publication", label: "Publication", type: "text", placeholder: "Where you write", required: true },
      { name: "deadline", label: "Deadline", type: "text", placeholder: "Optional" },
      {
        name: "request",
        label: "Your request",
        type: "textarea",
        placeholder: "What do you need from us?",
        required: true,
        full: true,
      },
    ],
  },
]
