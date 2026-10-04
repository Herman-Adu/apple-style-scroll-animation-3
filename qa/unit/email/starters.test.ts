import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  STARTERS,
  buildFromExisting,
  buildFromStarter,
  getStarter,
} from "@/features/email/lib/content/starters";
import {
  findPlaceholderKeys,
  PLACEHOLDERS,
} from "@/features/email/lib/content/placeholders";
import type { EmailBlock } from "@/features/email/lib/blocks/types";
import { REPO_ROOT } from "@/qa/config/repo-root";

let n = 0;
const makeId = () => `id-${++n}`;
const known = new Set(PLACEHOLDERS.map((p) => p.key));

describe("STARTERS", () => {
  it("offers the expected starters with Blank first", () => {
    expect(STARTERS.map((s) => s.id)).toEqual([
      "blank",
      "newsletter",
      "product-launch",
      "sale",
      "announcement",
      "black-friday",
      "bank-holiday",
      "christmas",
    ]);
  });

  it("groups the seasonal campaigns separately from the essentials", () => {
    expect(
      STARTERS.filter((s) => s.group === "seasonal").map((s) => s.id),
    ).toEqual(["black-friday", "bank-holiday", "christmas"]);
  });

  it("every hero image a starter references exists in public/", () => {
    for (const s of STARTERS) {
      for (const b of s.blocks) {
        if (b.type === "hero" && b.imageUrl) {
          expect(
            existsSync(
              join(REPO_ROOT, "public", b.imageUrl.replace(/^[/\\\\]/, "")),
            ),
            `${s.id}: ${b.imageUrl}`,
          ).toBe(true);
        }
      }
    }
  });

  it("seasonal starters each carry their own hero image", () => {
    for (const s of STARTERS.filter((x) => x.group === "seasonal")) {
      const hero = s.blocks.find((b) => b.type === "hero") as
        | { imageUrl: string }
        | undefined;
      expect(hero?.imageUrl, s.id).toMatch(/^\/email\/hero-.+\.png$/);
    }
  });

  it("has unique ids", () => {
    expect(new Set(STARTERS.map((s) => s.id)).size).toBe(STARTERS.length);
  });

  it("only uses known placeholders in subjects, preview text and blocks", () => {
    for (const s of STARTERS) {
      const text = [s.subject, s.previewText, JSON.stringify(s.blocks)].join(
        " ",
      );
      for (const key of findPlaceholderKeys(text))
        expect(known.has(key), `${s.id}: ${key}`).toBe(true);
    }
  });

  it("never contains order-only blocks", () => {
    for (const s of STARTERS) {
      expect(
        s.blocks.some(
          (b) => b.type === "orderSummary" || b.type === "lowStockItems",
        ),
      ).toBe(false);
    }
  });
});

describe("buildFromStarter", () => {
  it("creates a marketing template with fresh, unique block ids", () => {
    const input = buildFromStarter("newsletter", makeId)!;
    expect(input.category).toBe("marketing");
    const ids = input.blocks.map((b) => b.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deep-copies blocks so edits never mutate the starter", () => {
    const input = buildFromStarter("sale", makeId)!;
    const first = input.blocks[0] as Extract<EmailBlock, { type: "hero" }>;
    first.heading = "changed";
    expect(JSON.stringify(getStarter("sale")!.blocks)).not.toContain("changed");
  });

  it("returns null for an unknown starter", () => {
    expect(buildFromStarter("nope", makeId)).toBeNull();
  });

  it("blank starter has a single text block to type into", () => {
    expect(
      buildFromStarter("blank", makeId)!.blocks.map((b) => b.type),
    ).toEqual(["text"]);
  });
});

describe("buildFromExisting", () => {
  const source = {
    name: "Order confirmation",
    category: "system",
    subject: "Order {{order_number}}",
    previewText: "Thanks",
    description: "desc",
    blocks: [
      { id: "x", type: "heading", text: "Hi", align: "left" },
    ] as EmailBlock[],
  };

  it("names it as a copy and moves system templates into marketing", () => {
    const input = buildFromExisting(source, makeId);
    expect(input.name).toBe("Order confirmation (copy)");
    expect(input.category).toBe("marketing");
    expect(input.previewText).toBe("Thanks");
  });

  it("keeps a non-system category", () => {
    expect(
      buildFromExisting({ ...source, category: "transactional" }, makeId)
        .category,
    ).toBe("transactional");
  });

  it("gives copied blocks new ids", () => {
    const input = buildFromExisting(source, makeId);
    expect(input.blocks[0].id).not.toBe("x");
    expect(source.blocks[0].id).toBe("x");
  });
});
