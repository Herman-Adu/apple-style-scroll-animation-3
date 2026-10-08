import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";

const bySlug = (slug: string) => docs.find((doc) => doc.slug === slug);

/** Every word of a doc's body, for scanning copy rather than structure. */
const bodyText = (slug: string): string => JSON.stringify(bySlug(slug)?.body ?? []);

describe("owner-gated positioning material", () => {
  it("keeps every Positioning doc owner-only", () => {
    // Positioning is the owner's own commercial material: what they charge, how
    // they answer objections, their CV lines and the posts they publish under
    // their own name. A fork sets NEXT_PUBLIC_OWNER_EMAILS to its own address,
    // so anything public here would ship inside someone else's product.
    const leaked = docs
      .filter((doc) => doc.category === "Positioning" && doc.access !== "owner")
      .map((doc) => doc.slug);

    expect(leaked).toEqual([]);
  });

  it("keeps the paste-ready posts owner-only, because they are written in the first person", () => {
    for (const slug of ["social-launch-pack", "social-launch-kit", "showcase-and-portfolio"]) {
      expect(bySlug(slug)?.access, `${slug} should stay gated`).toBe("owner");
    }
  });
});

describe("the public showcase-assets doc", () => {
  const slug = "showcase-launch-assets";

  it("is public, so the template can show what it produces", () => {
    const doc = bySlug(slug);
    expect(doc, `${slug} should exist`).toBeDefined();
    expect(doc!.access ?? "public").toBe("public");
  });

  it("describes the pipeline without carrying anyone's personal pitch", () => {
    // The split only holds if the public half stays neutral. Naming an audience
    // ("hiring managers and CTOs") is fine — that describes who a carousel is
    // for. Addressing one in the owner's own voice is not.
    const text = bodyText(slug);
    for (const pattern of [
      /\bI built\b/i,
      /\bif you are hiring\b/i,
      /\bhire me\b/i,
      /\bmy career\b/i,
      /\bday rate\b/i,
      /\bsend me a message\b/i,
    ]) {
      expect(text, `${slug} should not contain ${pattern}`).not.toMatch(pattern);
    }
  });

  it("points at the pack carousels it claims to generate", () => {
    const text = bodyText(slug);
    for (const file of [
      "/showcase/social/linkedin-recruiter-carousel.pdf",
      "/showcase/social/linkedin-buyer-carousel.pdf",
      "/showcase/social/linkedin-engineer-carousel.pdf",
    ]) {
      expect(text).toContain(file);
    }
  });
});
