import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";

/**
 * The ADR doc carries its own index table, so it can drift from the records
 * below it - and it had: ADR-011 was written as a record and never added to the
 * index, which is how a reader scanning the table concludes a decision was
 * never made. The index is derived from nothing, so it needs a guard.
 */

const adrDoc = docs.find((doc) => doc.slug === "architecture-decision-records");

function indexNumbers(): string[] {
  const table = adrDoc?.body.find(
    (block) => block.type === "table" && /index/i.test(block.title ?? ""),
  );
  if (table?.type !== "table") throw new Error("no ADR index table");

  return table.rows.map((row) => row[0]);
}

function recordNumbers(): string[] {
  return adrDoc!.body.flatMap((block) =>
    block.type === "heading"
      ? (block.text.match(/^ADR-(\d+)/)?.slice(1, 2) ?? [])
      : [],
  );
}

describe("the ADR index", () => {
  it("lists every record, in the same order", () => {
    expect(indexNumbers()).toEqual(recordNumbers());
  });

  it("numbers the records consecutively from 001", () => {
    const expected = recordNumbers().map((_, i) =>
      String(i + 1).padStart(3, "0"),
    );

    expect(recordNumbers()).toEqual(expected);
  });

  it("gives every record a context, a decision and a trade-off", () => {
    const headings = adrDoc!.body
      .map((block, i) => ({ block, i }))
      .filter(({ block }) => block.type === "heading" && /^ADR-\d/.test(block.text));

    expect(headings.length).toBeGreaterThan(0);

    for (const { block, i } of headings) {
      if (block.type !== "heading") continue;
      const prose = adrDoc!.body
        .slice(i + 1)
        .find((next) => next.type === "paragraph");

      expect(prose, `${block.text} has no record text`).toBeDefined();
      if (prose?.type !== "paragraph") continue;

      for (const part of ["Context:", "Decision:", "Trade-off:"]) {
        expect(prose.text, `${block.text} is missing "${part}"`).toContain(part);
      }
    }
  });
});
