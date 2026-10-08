# Running Playwright from Test Explorer and Terminal

This note explains how to run the project's Playwright tests from the VS Code Test Explorer extension as well as from the terminal. It covers starting the dev server, ensuring the extension targets the correct port, and common troubleshooting steps.

1. Start the dev server (the app always runs on 3000):

```powershell
pnpm run dev
```

2. Run Playwright from the terminal (no VS Code restart needed):

```powershell
# use QA_BASE_URL to force tests to a running URL
$env:QA_BASE_URL='http://localhost:3000'
pnpm run test:e2e
```

3. Run Playwright from VS Code Test Explorer (no restart):

- Ensure the dev server is running on the port listed in `.vscode/settings.json` (`playwright.serverUrl`).
- In Test Explorer: refresh (icon), select the Playwright run target (playwright-run), then click Run.
- If the extension starts the web server itself it will use the `playwright.config.mts` `webServer.command` (repo default: `pnpm run dev`) and `webServer.port`.

4. Troubleshooting

- If tests are hitting the wrong app (another local service on the same port), either stop that service or set `QA_BASE_URL` to the correct URL before running tests.
- To force the extension to pick up environment changes without restarting VS Code, set `playwright.serverUrl` in `.vscode/settings.json` and click Test Explorer → refresh.
- If Playwright reports 404 or unexpected content for sitemap/OG endpoints, verify the dev server is serving the storefront (curl `/sitemap.xml` and `/opengraph-image`).

Files involved

- `qa/config/playwright.config.mts` — Playwright config & `webServer` entry used by the extension.
- `.vscode/settings.json` — workspace hints for the extension (`playwright.serverUrl`, `playwright.serverCommand`).

If you want this note placed somewhere else or extended into the project README, tell me where.
