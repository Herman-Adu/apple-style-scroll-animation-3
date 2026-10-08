import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");
const read = (file: string) => readFileSync(join(ROOT, file), "utf8");

/**
 * One port, everywhere. The repo used to run on 3001 so it could sit beside
 * another project's dev server; that is no longer true, and a second port only
 * costs a setting to remember in every config, env file and runbook.
 */
const DEV_PORT = 3000;

const packageJson = JSON.parse(read("package.json")) as {
  scripts: Record<string, string>;
};

/** Files that would pin a port: scripts, test configs, CI, editor and runbooks. */
const PORT_BEARING_FILES = [
  "package.json",
  "qa/config/playwright.config.mts",
  "qa/config/playwright.social.config.mts",
  "qa/config/playwright.showcase.config.mts",
  "docs/PLAYWRIGHT-TEST-EXPLORER.md",
  ".github/workflows/ci.yml",
  ".vscode/settings.json",
  "docs/local-runbook.md",
  "docs/showcase-pipeline.md",
];

describe("the app has one dev port", () => {
  it.each(PORT_BEARING_FILES)("%s names no app port other than the dev port", (file) => {
    // Only 3xxx: a database on 5432 or a mail catcher elsewhere is not a Next
    // server and has nothing to do with which port the app answers on.
    const ports = [...read(file).matchAll(/localhost:(3\d{3})|-p\s+(3\d{3})|PORT\s*\?\?\s*(3\d{3})/g)]
      .flatMap((match) => [match[1], match[2], match[3]])
      .filter(Boolean)
      .map(Number);

    expect([...new Set(ports)].filter((port) => port !== DEV_PORT)).toEqual([]);
  });

  it.each(PORT_BEARING_FILES)("%s does not call a dev script that was removed", (file) => {
    // A config naming a script that no longer exists fails at run time, not at
    // review time: the webServer command simply never starts.
    const called = [...read(file).matchAll(/pnpm (?:run )?([\w:]+)/g)].map((m) => m[1]);
    const known = new Set(Object.keys(packageJson.scripts));
    expect(called.filter((script) => script.includes(":") && !known.has(script))).toEqual([]);
  });

  it("has a single dev script, so there is no second one to choose between", () => {
    expect(packageJson.scripts.dev).toBeDefined();
    expect(packageJson.scripts["dev:local"]).toBeUndefined();
  });

  it("points the Stripe forwarder at the same port the app serves", () => {
    expect(packageJson.scripts["stripe:listen"]).toContain(`localhost:${DEV_PORT}/api/stripe/webhook`);
  });

  it("boots the social exporter on that port too", () => {
    const config = read("qa/config/playwright.social.config.mts");
    expect(config).toMatch(new RegExp(`process\\.env\\.PORT\\s*\\?\\?\\s*${DEV_PORT}`));
  });

  it("polls the port the dev script actually binds", () => {
    // The exporter used to wait on one port while the command listened on
    // another, which surfaced only as a 120s timeout with no explanation.
    const pinned = /-p\s+(\d{4})/.exec(packageJson.scripts.dev);
    const effective = pinned ? Number(pinned[1]) : 3000; // `next dev` defaults to 3000
    expect(effective).toBe(DEV_PORT);
  });
});
