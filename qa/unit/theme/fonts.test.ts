import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");

const globals = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");

/** The declared stack for a `--font-*` token, families in order. */
const stack = (token: string): string[] => {
  const match = new RegExp(`${token}:\\s*([^;]+);`).exec(globals);
  expect(match, `${token} should be declared in globals.css`).not.toBeNull();
  return match![1].split(",").map((part) => part.trim().replace(/^["']|["']$/g, ""));
};

/**
 * Fonts the app actually ships. `next/font/google` self-hosts each family and
 * exposes it through the CSS variable passed as `variable`, so a stack that
 * names a family we never load silently falls through to whatever the machine
 * happens to have.
 */
const loadedVariables = (): string[] =>
  [...layout.matchAll(/variable:\s*["'](--[\w-]+)["']/g)].map((m) => m[1]);

describe("font tokens resolve to fonts the app loads", () => {
  it("loads every font it puts first in a stack, so renders do not depend on the machine", () => {
    // The social export screenshots these tokens. When the first family is not
    // loaded, the same slide renders with a different typeface on Linux and on
    // Windows, and every committed PNG churns whenever the renderer moves.
    for (const token of ["--font-sans", "--font-mono"]) {
      const first = stack(token)[0];
      const isVariable = /^var\((--[\w-]+)\)$/.exec(first);
      if (isVariable) {
        expect(loadedVariables(), `${token} points at an unloaded variable`).toContain(isVariable[1]);
        continue;
      }
      // A bare family name only works when next/font registers that exact name.
      expect(layout, `${token} starts with "${first}", which layout.tsx never loads`).toMatch(
        new RegExp(`\\b${first.replace(/[\s-]/g, "_")}\\b`),
      );
    }
  });

  it("keeps a generic monospace last so the stack still degrades safely", () => {
    expect(stack("--font-mono").at(-1)).toBe("monospace");
  });
});
