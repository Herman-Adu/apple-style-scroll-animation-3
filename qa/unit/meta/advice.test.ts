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
 *
 * S52: a mention is not advice. The first version matched the bare string
 * anywhere, which banned the vocabulary needed to explain itself - the entry in
 * `troubleshooting.md` that documents the cap could not name the flag it
 * replaced, the S51 ledger row had to talk around it, and a reader who
 * remembered the old flag and searched the docs for it found nothing. What is
 * refused now is an occurrence the reader can act on, which is the only kind
 * that can mislead: the flag carrying a value, or the flag inside a command
 * they can copy. Prose about the flag is free.
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

// A runnable thing the reader can copy. The flag sitting next to one of these
// is an instruction however the sentence around it is phrased.
const RUNNABLE = /\b(?:pnpm|npx|yarn|node|playwright|vitest)\b/;

/**
 * The text that decides whether an occurrence is an instruction: the inline
 * code span holding it, or the whole line when it is not in one. Scoping to the
 * span is what lets one line both name the flag and run an unrelated command -
 * the S51 ledger row says "the `--workers` flag ... which `pnpm health` was
 * still printing", and only a line-wide rule would read that as advice.
 */
function scopeAround(line: string, index: number): string {
  for (const match of line.matchAll(/`([^`\n]+)`/g)) {
    const start = match.index;
    if (start === undefined) continue;
    if (index > start && index < start + match[0].length) return match[1];
  }
  return line;
}

/** True when this line tells the reader to pass `flag` rather than naming it. */
function isAdvisedAsFlag(line: string, flag: string): boolean {
  for (let at = line.indexOf(flag); at !== -1; at = line.indexOf(flag, at + 1)) {
    const after = line.slice(at + flag.length);
    if (/^[=:]\S/.test(after)) return true; // --workers=2
    if (/^\s+\d/.test(after)) return true; // --workers 2
    if (RUNNABLE.test(scopeAround(line, at))) return true; // pnpm test:smoke --workers
  }
  return false;
}

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
      .map((line, index) => (isAdvisedAsFlag(line, flag) ? `${file}:${index + 1}` : null))
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

// The teeth. Each line below is the shape, not a quote: an instruction is
// anything the reader can lift and run, including the plain printed string that
// S49 left in `pnpm health`.
describe("what counts as advising a flag", () => {
  it.each([
    "run `pnpm test:smoke --workers=2` when the machine is busy",
    "pass `--workers 2` to the gate",
    "    pnpm exec playwright test --config qa/config/playwright.config.mts --workers",
    '  console.log("Low headroom. Re-run smoke with --workers 2.");',
    "set --workers:2 in the command",
  ])("refuses %j", (line) => {
    expect(isAdvisedAsFlag(line, "--workers")).toBe(true);
  });

  it.each([
    "Passing `--workers` by hand is obsolete: the config applies the cap for you.",
    "the `--workers` flag S49 made obsolete, which `pnpm health` was still printing",
    "`--workers` is applied by the gate config; override it with `PW_WORKERS`.",
    "only then go lower with `PW_WORKERS=1 pnpm test:smoke`",
  ])("allows %j", (line) => {
    expect(isAdvisedAsFlag(line, "--workers")).toBe(false);
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
      `${setting.appliedBy} already applies ${setting.flag}. Name it in prose if the reader needs to know it is obsolete, but do not print a command that passes it - and name ${setting.instead} for overriding it.`,
    ).toEqual([]);
  });
});
