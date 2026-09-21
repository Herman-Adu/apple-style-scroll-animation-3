import type { Article } from "@/lib/types"

export const articles: Article[] = [
  {
    slug: "inside-the-anechoic-lab",
    title: "Inside the Anechoic Lab",
    excerpt:
      "Where does a sound go when there is nothing to reflect it? We spent a week in the chamber that tunes every Momo driver.",
    category: "Engineering",
    coverImage: "/articles/acoustics-lab.png",
    author: { name: "Dara Okonkwo", role: "Lead Acoustic Engineer" },
    publishedAt: "2026-02-18",
    readingMinutes: 6,
    body: [
      {
        type: "paragraph",
        text: "Step inside our anechoic chamber and the first thing you notice is what you cannot hear. Foam wedges the length of your forearm line every surface, swallowing echoes before they can form. Your own heartbeat becomes the loudest thing in the room.",
      },
      { type: "heading", text: "Measuring the truth" },
      {
        type: "paragraph",
        text: "Every Momo driver begins its life here. We sweep it from 5Hz to 40kHz and capture the response with reference microphones calibrated to a thousandth of a decibel. There is nowhere for a flaw to hide.",
      },
      {
        type: "quote",
        text: "In here there is no room to blame. If the driver colors the sound, the chamber tells us — every single time.",
        attribution: "Dara Okonkwo",
      },
      {
        type: "paragraph",
        text: "That obsession with neutrality is why a Momo X measured in Accra sounds identical to one measured in Berlin. The chamber is the great equalizer.",
      },
    ],
  },
  {
    slug: "the-craft-of-titanium",
    title: "The Craft of Titanium",
    excerpt:
      "Aerospace-grade metal is stubborn, expensive, and slow to machine. Here is why we build our frames from it anyway.",
    category: "Design",
    coverImage: "/articles/titanium-craft.png",
    author: { name: "Mika Sorensen", role: "Head of Industrial Design" },
    publishedAt: "2026-01-30",
    readingMinutes: 5,
    body: [
      {
        type: "paragraph",
        text: "Titanium does not want to become a headphone. It resists the tools, dulls the bits, and demands patience most manufacturers are unwilling to spend. That resistance is exactly the point.",
      },
      { type: "heading", text: "Strength without weight" },
      {
        type: "paragraph",
        text: "Grade-5 titanium gives us the stiffness of steel at nearly half the mass. A stiffer frame means the acoustic chamber never flexes, so the driver plays into a stable, silent structure.",
      },
      {
        type: "quote",
        text: "We chose the harder material so the sound could be easy.",
        attribution: "Mika Sorensen",
      },
      {
        type: "paragraph",
        text: "Each yoke is machined from a solid billet over the course of forty minutes, then hand-finished. It is slow. It is deliberate. It lasts a lifetime.",
      },
    ],
  },
  {
    slug: "what-spatial-audio-really-means",
    title: "What Spatial Audio Really Means",
    excerpt:
      "Marketing loves the phrase. We break down the psychoacoustics that let two drivers wrap sound around your head.",
    category: "Sound",
    coverImage: "/articles/spatial-audio.png",
    author: { name: "Priya Nair", role: "DSP Researcher" },
    publishedAt: "2026-03-04",
    readingMinutes: 7,
    body: [
      {
        type: "paragraph",
        text: "Your brain locates sound using tiny differences in timing and tone between your two ears. Spatial audio is the art of recreating those cues with only two drivers, tricking the mind into hearing a room that is not there.",
      },
      { type: "heading", text: "Head tracking changes everything" },
      {
        type: "paragraph",
        text: "Static spatial audio collapses the moment you turn your head. By tracking motion sixty times a second, Momo X keeps the soundstage anchored in the world, not to your skull.",
      },
      {
        type: "quote",
        text: "The goal is not to impress you with effects. It is to make you forget the headphones exist.",
        attribution: "Priya Nair",
      },
      {
        type: "paragraph",
        text: "Done well, spatial audio is invisible. A cello sits three feet in front of you. A voice moves across the room. And you never once think about the drivers making it happen.",
      },
    ],
  },
]

export function getAllArticles(): Article[] {
  return [...articles].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

export function getArticleSlugs(): string[] {
  return articles.map((article) => article.slug)
}
