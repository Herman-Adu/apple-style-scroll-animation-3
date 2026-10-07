import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "../../..");

const socialConfig = readFileSync(
  join(ROOT, "qa/config/playwright.social.config.mts"),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
) as { scripts: Record<string, string> };

/** The port a `next dev -p <port>` script listens on. */
const scriptPort = (script: string): number => {
  const match = /-p\s+(\d+)/.exec(packageJson.scripts[script] ?? "");
  expect(match, `${script} should pin a port with -p`).not.toBeNull();
  return Number(match![1]);
};

/** The default in `Number(process.env.PORT ?? <default>)`. */
const configDefaultPort = (): number => {
  const match = /process\.env\.PORT\s*\?\?\s*(\d+)/.exec(socialConfig);
  expect(match, "the social config should default PORT").not.toBeNull();
  return Number(match![1]);
};

describe("social export harness", () => {
  it("boots the dev server on the same port Playwright waits on", () => {
    // `webServer.port` is what Playwright polls; the command is what actually
    // listens. When they disagree the export dies after a 120s timeout with no
    // hint why, so `pnpm showcase:assets` fails for anyone who has not been
    // told to set PORT by hand.
    const command = /command:\s*"pnpm run ([\w:]+)"/.exec(socialConfig);
    expect(command, "the social config should launch a dev script").not.toBeNull();

    expect(configDefaultPort()).toBe(scriptPort(command![1]));
  });

  it("keeps its own port so a dev server on 3000 is never reused by the exporter", () => {
    // The exporter writes into public/. Sharing the everyday dev port would let
    // `reuseExistingServer` attach to whatever is already running there.
    expect(configDefaultPort()).not.toBe(3000);
  });
});
