import type { Product } from "@/lib/types"

export const products: Product[] = [
  {
    slug: "momo-x",
    name: "Momo X",
    tagline: "Pure Sound. Zero Compromise.",
    category: "Headphones",
    price: { amount: 549, currency: "USD" },
    summary: "The flagship over-ear. Titanium build, 40mm planar drivers, and reference-grade silence.",
    description:
      "Momo X is the culmination of a decade of acoustic research. A machined titanium frame houses 40mm planar magnetic drivers tuned in our anechoic lab, while adaptive noise cancellation removes the world so only the music remains.",
    image: "/frames/00096.jpg",
    accent: "oklch(0.72 0.15 250)",
    featured: true,
    releaseStatus: "preorder",
    hero: {
      kind: "frames",
      framePath: "/frames/",
      frameCount: 192,
      scrollVh: 500,
      intro: {
        kicker: "Introducing",
        title: "Momo X",
        subtitle: "Pure Sound. Zero Compromise.",
      },
      beats: [
        {
          index: "01",
          title: "Designed for\nPrecision.",
          description:
            "Every component engineered with sub-millimeter accuracy for perfect acoustic response.",
          align: "left",
          window: [0.18, 0.28, 0.42, 0.52],
        },
        {
          index: "02",
          title: "Titanium\nPerformance.",
          description:
            "Aerospace-grade materials deliver uncompromising durability and featherlight comfort.",
          align: "right",
          window: [0.52, 0.62, 0.76, 0.86],
        },
        {
          index: "03",
          title: "Hear Beyond.",
          description:
            "40mm planar drivers. Active noise cancellation. 60-hour battery. Spatial audio ready.",
          align: "left",
          window: [0.88, 0.95, 1.1, 1.2],
        },
      ],
    },
    features: [
      {
        title: "Active Noise Cancellation",
        description:
          "-45dB reduction with adaptive algorithms that analyze and neutralize ambient sound in real time.",
        stat: "-45",
        statUnit: "dB",
      },
      {
        title: "40mm Planar Drivers",
        description:
          "An ultra-thin diaphragm delivers distortion-free audio from deep bass to crystalline highs.",
        stat: "40",
        statUnit: "mm",
      },
      {
        title: "All-Day Battery",
        description: "60 hours of playback. Ten minutes of charge returns five hours of listening.",
        stat: "60",
        statUnit: "hours",
      },
      {
        title: "Spatial Audio",
        description: "Immersive 360° soundstage with dynamic head tracking positions every note in space.",
        stat: "360",
        statUnit: "degree",
      },
    ],
    specs: [
      { label: "Driver", value: "40mm planar magnetic" },
      { label: "Frequency response", value: "5Hz – 40kHz" },
      { label: "Battery", value: "60", unit: "hours" },
      { label: "Weight", value: "285", unit: "g" },
      { label: "Connectivity", value: "Bluetooth 5.3 · USB-C" },
      { label: "Noise cancellation", value: "-45dB adaptive" },
    ],
    colors: ["Titanium", "Midnight", "Stone"],
  },
  {
    slug: "momo-air",
    name: "Momo Air",
    tagline: "Weightless. Wireless. Everywhere.",
    category: "Earbuds",
    price: { amount: 249, currency: "USD" },
    summary: "Feather-light wireless earbuds with adaptive transparency and a pocketable charging case.",
    description:
      "Momo Air disappears the moment you wear it. Custom 11mm dynamic drivers and a six-microphone array bring studio clarity to a 4.2 gram earbud, while adaptive transparency lets the right amount of world back in.",
    image: "/products/momo-air.png",
    accent: "oklch(0.78 0.14 190)",
    featured: true,
    releaseStatus: "available",
    hero: {
      kind: "parallax",
      image: "/products/momo-air.png",
      accent: "oklch(0.78 0.14 190)",
      motion: "rise",
      scrollVh: 320,
      intro: {
        kicker: "Introducing",
        title: "Momo Air",
        subtitle: "Weightless. Wireless. Everywhere.",
      },
      beats: [
        {
          index: "01",
          title: "4.2 grams\nof silence.",
          description: "So light you forget it is there — until the noise around you simply vanishes.",
          align: "left",
          window: [0.16, 0.26, 0.4, 0.5],
        },
        {
          index: "02",
          title: "Adaptive\nTransparency.",
          description: "Six microphones read your surroundings and let the world back in, exactly as much as you want.",
          align: "right",
          window: [0.52, 0.62, 0.78, 0.88],
        },
      ],
    },
    features: [
      {
        title: "Adaptive Transparency",
        description: "Real-time ambient blending keeps you aware without ever removing an earbud.",
        stat: "6",
        statUnit: "mics",
      },
      {
        title: "11mm Dynamic Drivers",
        description: "Punchy, detailed sound engineered to fill a room from inside your ears.",
        stat: "11",
        statUnit: "mm",
      },
      {
        title: "Pocketable Power",
        description: "8 hours per charge, 32 hours with the case. Wireless charging built in.",
        stat: "32",
        statUnit: "hours",
      },
      {
        title: "Sweat & Water Resistant",
        description: "IPX4 rated for workouts, rain, and everything the commute throws at you.",
        stat: "IPX4",
        statUnit: "rated",
      },
    ],
    specs: [
      { label: "Driver", value: "11mm dynamic" },
      { label: "Frequency response", value: "20Hz – 20kHz" },
      { label: "Battery", value: "32", unit: "hours (with case)" },
      { label: "Weight", value: "4.2", unit: "g per bud" },
      { label: "Connectivity", value: "Bluetooth 5.3" },
      { label: "Water resistance", value: "IPX4" },
    ],
    colors: ["Cloud", "Graphite", "Sky"],
  },
  {
    slug: "momo-studio",
    name: "Momo Studio",
    tagline: "Reference Truth.",
    category: "Headphones",
    price: { amount: 699, currency: "USD" },
    summary: "Open-back reference headphones for mixing, mastering, and hearing exactly what is there.",
    description:
      "Momo Studio is built for people who make sound for a living. An open-back acoustic chamber and hand-matched drivers reveal every detail with a flat, honest response — no coloring, no hype, just the truth of the recording.",
    image: "/products/momo-studio.png",
    accent: "oklch(0.7 0.13 60)",
    featured: false,
    releaseStatus: "available",
    hero: {
      kind: "parallax",
      image: "/products/momo-studio.png",
      accent: "oklch(0.7 0.13 60)",
      motion: "drift",
      scrollVh: 320,
      intro: {
        kicker: "For the studio",
        title: "Momo Studio",
        subtitle: "Reference Truth.",
      },
      beats: [
        {
          index: "01",
          title: "Open-back\nby design.",
          description: "A ventilated acoustic chamber creates a wide, natural soundstage with zero pressure buildup.",
          align: "left",
          window: [0.16, 0.26, 0.4, 0.5],
        },
        {
          index: "02",
          title: "Hand-matched\ndrivers.",
          description: "Every pair is matched to within 0.5dB so left and right are perfectly, provably balanced.",
          align: "right",
          window: [0.52, 0.62, 0.78, 0.88],
        },
      ],
    },
    features: [
      {
        title: "Flat Reference Tuning",
        description: "A neutral curve engineered so what you mix is what everyone else hears.",
        stat: "±0.5",
        statUnit: "dB",
      },
      {
        title: "Open-Back Soundstage",
        description: "Airy, three-dimensional imaging that mirrors a well-treated control room.",
        stat: "70",
        statUnit: "mm driver",
      },
      {
        title: "Replaceable Everything",
        description: "Cables, pads, and headband swap out by hand. Built to outlast the sessions.",
        stat: "100%",
        statUnit: "serviceable",
      },
      {
        title: "Ultra-Low Distortion",
        description: "Total harmonic distortion under 0.05% across the audible range.",
        stat: "0.05",
        statUnit: "% THD",
      },
    ],
    specs: [
      { label: "Driver", value: "70mm dynamic, open-back" },
      { label: "Frequency response", value: "8Hz – 45kHz" },
      { label: "Impedance", value: "80", unit: "ohm" },
      { label: "Weight", value: "330", unit: "g" },
      { label: "Cable", value: "Detachable 3m + 1.5m" },
      { label: "Distortion", value: "<0.05% THD" },
    ],
    colors: ["Studio Black", "Silver"],
  },
  {
    slug: "momo-beat",
    name: "Momo Beat",
    tagline: "Fill the Room.",
    category: "Speakers",
    price: { amount: 349, currency: "USD" },
    summary: "A portable 360° speaker with room-filling bass and 24 hours of untethered play.",
    description:
      "Momo Beat wraps a 360° acoustic array in brushed titanium. Dual passive radiators push bass you can feel, adaptive room tuning reads your space, and a single charge lasts a full day and night.",
    image: "/products/momo-beat.png",
    accent: "oklch(0.7 0.16 20)",
    featured: true,
    releaseStatus: "available",
    hero: {
      kind: "exploded",
      accent: "oklch(0.7 0.16 20)",
      scrollVh: 500,
      layers: [
        { image: "/products/beat-exploded/01-cap.png", label: "Titanium cap", assembledY: -15, explodedY: -46, height: 46, z: 6 },
        { image: "/products/beat-exploded/02-grille.png", label: "360° acoustic grille", assembledY: -5, explodedY: -22, height: 46, z: 5 },
        { image: "/products/beat-exploded/03-driver.png", label: "Full-range driver", assembledY: 4, explodedY: 4, height: 46, z: 4 },
        { image: "/products/beat-exploded/04-radiator.png", label: "Amp & passive radiator", assembledY: 12, explodedY: 28, height: 46, z: 3 },
        { image: "/products/beat-exploded/05-base.png", label: "Machined base", assembledY: 20, explodedY: 52, height: 46, z: 2 },
      ],
      intro: {
        kicker: "Sound everywhere",
        title: "Momo Beat",
        subtitle: "Fill the Room.",
      },
      beats: [
        {
          index: "01",
          title: "Every layer\nengineered.",
          description: "Six precision components stack into a machined titanium body no wider than a coffee cup.",
          align: "left",
          window: [0.18, 0.28, 0.42, 0.52],
        },
        {
          index: "02",
          title: "Bass you\nfeel.",
          description: "A dedicated full-range driver and opposed passive radiator move real air for depth that belies its size.",
          align: "right",
          window: [0.54, 0.64, 0.74, 0.82],
        },
        {
          index: "03",
          title: "360°\nof sound.",
          description: "Assembled, the radial array projects evenly in every direction — no sweet spot, no dead zones.",
          align: "left",
          window: [0.86, 0.93, 1.1, 1.2],
        },
      ],
    },
    features: [
      {
        title: "360° Radial Array",
        description: "Evenly dispersed sound that fills a room from anywhere you set it down.",
        stat: "360",
        statUnit: "degree",
      },
      {
        title: "Adaptive Room Tuning",
        description: "Onboard mics measure your space and correct the response in real time.",
        stat: "1",
        statUnit: "tap setup",
      },
      {
        title: "All-Day Battery",
        description: "24 hours of playback, and it charges your phone in a pinch.",
        stat: "24",
        statUnit: "hours",
      },
      {
        title: "Built to Travel",
        description: "IP67 dust and waterproof in a machined titanium body that shrugs off the outdoors.",
        stat: "IP67",
        statUnit: "rated",
      },
    ],
    specs: [
      { label: "Drivers", value: "Dual 20mm + 2 radiators" },
      { label: "Output", value: "40", unit: "W" },
      { label: "Battery", value: "24", unit: "hours" },
      { label: "Weight", value: "980", unit: "g" },
      { label: "Connectivity", value: "Bluetooth 5.3 · Aux" },
      { label: "Durability", value: "IP67" },
    ],
    colors: ["Titanium", "Slate"],
  },
]

export function getAllProducts(): Product[] {
  return products
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured)
}

export function getProductSlugs(): string[] {
  return products.map((product) => product.slug)
}
