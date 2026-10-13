import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * Advice has to match the repo. S49 moved the local Playwright worker cap into
 * the gate config, and two places kept telling the reader to pass the flag by
 * hand - one of them a line `pnpm health` prints every time memory is tight.
 * Nothing failed, because no test had ever looked at what the tooling says.
 *
 * The authority is whatever applies the setting, not a list of banned strings:
 * each rule below names the file that applies it and the proof that it still
 * does. Take the cap out of the config and the premise fails first, so the rule
 * has to be deleted deliberately - advice can never quietly become true again
 * by weakening what the repo does.
 */

type AppliedSetting = {
  /** What the reader must no longer be told to pass. */
  flag: string;
  /** Repo-relative file that applies it for them. */
  appliedBy: string;
  /** Proof it is still applied there. */
  detect: RegExp;
  /** The supported way to override it, named in the failure message. */
  instead: string;
};

const APPLIED_FOR_YOU: AppliedSetting[] = [
  {
    flag: "--workers",
    appliedBy: "qa/config/playwright.config.mts",
    detect: /workers:\s*isCI\s*\?\s*undefined\s*:/,
    instead: "PW_WORKERS",
  },
];

// Where the repo gives instructions: what the tooling prints, what an agent
// reads, and the docs. `v0_plans/` is left out on purpose - a plan records what
// was true when it was written, and editing that would hide why a sprint
// happened. `qa/` is left out because configs apply settings rather than advise
// them.
const ADVICE_TREES = [
  { dir: "scripts", extensions: [".mjs"] },
  { dir: ".agents/skills", extensions: [".md"] },
  { dir: "docs", extensions: [".md"] },
];
const ADVICE_ROOT_FILES = ["AGENTS.md", "README.md"];

function filesUnder(dir: string, extensions: string[]): string[] {
  const absolute = join(REPO_ROOT, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return filesUnder(child, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [child] : [];
  });
}

const adviceFiles = [
  ...ADVICE_TREES.flatMap(({ dir, extensions }) => filesUnder(dir, extensions)),
  ...ADVICE_ROOT_FILES.filter((file) => existsSync(join(REPO_ROOT, file))),
];

function citationsOf(flag: string): string[] {
  return adviceFiles.flatMap((file) =>
    readFileSync(join(REPO_ROOT, file), "utf8")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line, index) => (line.includes(flag) ? `${file}:${index + 1}` : null))
      .filter((citation): citation is string => citation !== null),
  );
}

describe("advice surfaces", () => {
  it("covers what the tooling prints, what agents read and the docs", () => {
    expect(adviceFiles).toContain("scripts/health.mjs");
    expect(adviceFiles).toContain(
      ".agents/skills/sprint-workflow/references/troubleshooting.md",
    );
    expect(adviceFiles).toContain("AGENTS.md");
  });

  it("leaves the plan archive alone", () => {
    expect(adviceFiles.filter((file) => file.startsWith("v0_plans"))).toEqual([]);
  });
});

describe.each(APPLIED_FOR_YOU)("$flag", (setting) => {
  it(`is still applied by ${setting.appliedBy}`, () => {
    const source = readFileSync(join(REPO_ROOT, setting.appliedBy), "utf8");
    expect(source).toMatch(setting.detect);
  });

  it("is never advised as a flag to pass by hand", () => {
    expect(
      citationsOf(setting.flag),
      `${setting.appliedBy} already applies ${setting.flag}. Describe that instead, and name ${setting.instead} for overriding it.`,
    ).toEqual([]);
  });
});
