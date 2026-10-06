import { describe, expect, it } from "vitest";
import { qrMatrix } from "@/features/showcase/lib/domain/qr";

describe("qrMatrix", () => {
  const matrix = qrMatrix("https://momo-audio.adudev.co.uk/docs/case-study-email-platform");

  it("is a square grid of modules", () => {
    expect(matrix.length).toBeGreaterThanOrEqual(21);
    for (const row of matrix) expect(row).toHaveLength(matrix.length);
  });

  it("starts with the finder pattern phones look for", () => {
    const finderTopRow = matrix[0].slice(0, 7);
    expect(finderTopRow).toEqual(Array(7).fill(true));
    expect(matrix[3].slice(0, 7)).toEqual([true, false, true, true, true, false, true]);
  });

  it("is deterministic and depends on the text", () => {
    expect(qrMatrix("a")).toEqual(qrMatrix("a"));
    expect(qrMatrix("a")).not.toEqual(qrMatrix("b"));
  });
});
