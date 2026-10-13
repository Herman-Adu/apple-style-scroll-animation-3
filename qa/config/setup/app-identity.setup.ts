import { expect, test as setup } from "@playwright/test";
import { siteConfig } from "@/lib/data/site";

/**
 * `reuseExistingServer` is what makes the local gate fast: it runs against the
 * dev server already listening on PORT instead of booting a second one. It will
 * reuse a *different project's* dev server just as happily. On Oct 13, 2026
 * `pnpm test:smoke` ran against another repo's app on port 3000 and reported
 * eight passes among sixteen failures - the failures read as broken pages, and
 * nothing in the output said the suite had tested the wrong application.
 *
 * Every other project depends on this one, so a stranger on the port stops the
 * run here, with the name of whatever answered.
 */
setup("the server on this port is this app", async ({ page, baseURL }) => {
  const response = await page.goto("/");
  expect(response?.ok(), `nothing usable answered at ${baseURL}`).toBe(true);

  // `app/layout.tsx` sets `applicationName` from the same config, so this
  // compares the app against its own name rather than a copy kept in step.
  const served = await page
    .locator('meta[name="application-name"]')
    .getAttribute("content");

  expect(
    served,
    `${baseURL} is serving ${served ? `"${served}"` : "an app with no application-name"}, not "${siteConfig.name}". Stop what is on that port, or give the gate one of its own with PORT=<n>.`,
  ).toBe(siteConfig.name);
});
