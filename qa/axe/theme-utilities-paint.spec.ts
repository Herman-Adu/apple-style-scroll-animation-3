import path from "node:path"
import { expect, test } from "@playwright/test"
import { paintedTextUtilities } from "../config/theme-utilities"

/**
 * Does the class actually paint the token? The question S67 raised and S74 left
 * open for `--info`.
 *
 * A Tailwind v4 colour utility is a class only because `--color-<name>` is
 * declared in `@theme inline`. Without that line `text-info` matches nothing,
 * the text silently inherits `--foreground`, and every static guard stays green
 * *because the stylesheet is correct*. S67 proved the mechanism by deleting the
 * line for `--destructive-strong`: the probe came back `rgb(11,11,11)` while
 * the token still resolved `rgb(188,0,0)`.
 *
 * S67's probe asserted it for one token. This asserts it for every colour the
 * app draws text in - 22 of them, derived in `qa/config/theme-utilities.ts`
 * from the `:root` palette and the markup, so a token added next sprint is
 * covered without anyone remembering to add it here. The companion unit test
 * holds the static half (the bridge line exists); this is the half only a
 * browser can make, because the cascade, the inline theme block the database
 * writes and Chromium's own `color-mix` are none of them visible in the source.
 *
 * **Why `--info` needed this and could not have it until now.** `--info` is
 * reached in exactly two places, `features/admin/components/status-badges.tsx`
 * and `.../email/campaign-list.tsx`, both behind the proxy: `curl /admin`
 * returns `307` to `/sign-in?redirect=%2Fadmin`, and there is no
 * admin-authenticated Playwright project to sign in with. So S74 shipped the
 * token with its value measured and its bridge asserted only as a string in the
 * stylesheet. A probe is what is available without a secrets gate, and it
 * answers precisely the question the string match cannot - which is also its
 * limit, stated here the way `destructive-contrast.spec.ts` states its own: this
 * says the served stylesheet paints `text-info`, and nothing about whether any
 * admin page is laid out correctly.
 *
 * **What a probe can and cannot be asked.** Where the token's own value is the
 * inherited one, painted and unpainted are the same colour and the probe has no
 * answer - true of `text-foreground` by definition, and of any token that
 * happens to equal it. Those are reported by name rather than skipped quietly,
 * because the set is derived from the page and could grow without anyone
 * choosing it.
 */

/** next-themes stores the choice under this key; the class on <html> follows it. */
const THEME_KEY = "theme"
type Theme = "light" | "dark"
const THEMES: readonly Theme[] = ["light", "dark"]

/** A real scanned route, with the real cascade and the real inline theme block. */
const PROBE_ROUTE = "/products"

/**
 * Derived at module load, so the test titles name a count a reader can check.
 *
 * The root is resolved from this file rather than through
 * `qa/config/repo-root.ts`, which evaluates `import.meta` - Playwright
 * transpiles a spec to CJS and cannot load it. The neighbouring specs resolve
 * their own paths relatively for the same reason.
 */
const REPO_ROOT = path.join(__dirname, "..", "..")
const UTILITIES = paintedTextUtilities(REPO_ROOT).map((utility) => utility.token)

const rgb = ([r, g, b]: number[]) => `rgb(${r},${g},${b})`

/**
 * Mounts one probe per token and reads back three colours each: what the
 * utility resolved to, what the token itself resolves to, and the inherited
 * `--foreground`. Each goes through a 1x1 canvas, because Chromium hands these
 * back in the space they were authored in - `oklch()` - which a naive `rgb()`
 * regex reads straight past.
 *
 * Declared at module scope and closing over nothing, because Playwright sends
 * the function's source to the page: a reference to anything in this file would
 * arrive undefined. That is also why the token list is an argument.
 */
function measureUtilities(tokens: string[]) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
  const toRgba = (value: string): number[] => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000"
    ctx.fillStyle = value
    ctx.fillRect(0, 0, 1, 1)
    return Array.from(ctx.getImageData(0, 0, 1, 1).data)
  }

  const root = getComputedStyle(document.documentElement)
  const inherited = toRgba(root.getPropertyValue("--foreground").trim())

  return {
    inherited,
    measured: tokens.map((token) => {
      document.getElementById("utility-probe")?.remove()
      const probe = document.createElement("span")
      probe.id = "utility-probe"
      // The probe is on `document.body`, outside the reveal subtree: a node
      // inside it would sit at `opacity: 0` until its scroll animation ran.
      probe.className = `text-${token}`
      probe.textContent = token
      document.body.appendChild(probe)
      return {
        token,
        painted: toRgba(getComputedStyle(probe).color),
        declared: toRgba(root.getPropertyValue(`--${token}`).trim()),
      }
    }),
  }
}

for (const theme of THEMES) {
  test(`every text utility the app reaches paints its own token on ${theme} (${UTILITIES.length} of them)`, async ({
    page,
  }) => {
    // A derived list that came back empty would make every assertion below
    // vacuous, which is the S74 canary problem: an empty result is what a
    // working sweep and a broken one both return.
    expect(UTILITIES.length, "the derived utility list is not empty").toBeGreaterThan(10)
    expect(UTILITIES, "the tokens this sprint exists for are in the list").toContain("info")

    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [THEME_KEY, theme] as const,
    )
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: theme })
    await page.goto(PROBE_ROUTE, { waitUntil: "networkidle" })
    // Fail loudly rather than measuring the other theme and reporting it green.
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))

    const { inherited, measured } = await page.evaluate(measureUtilities, UTILITIES)

    // Every token resolves on the served page at all. A bridge cannot be
    // measured through a token the cascade dropped.
    expect(
      measured.filter((m) => m.declared[3] === 0).map((m) => `--${m.token}`),
      "these tokens resolve to nothing on the served page",
    ).toEqual([])

    // The failure no static guard can see: the utility matched nothing, so the
    // text is painting the inherited colour instead of the token.
    expect(
      measured
        .filter(
          (m) =>
            String(m.painted.slice(0, 3)) !== String(m.declared.slice(0, 3)) &&
            String(m.declared.slice(0, 3)) !== String(inherited.slice(0, 3)),
        )
        .map(
          (m) =>
            `text-${m.token} painted ${rgb(m.painted)}, token --${m.token} is ${rgb(m.declared)}` +
            `${String(m.painted.slice(0, 3)) === String(inherited.slice(0, 3)) ? " - that is the inherited --foreground, so the @theme inline bridge is missing" : ""}`,
        ),
      `on ${theme}, a utility painting anything but its token`,
    ).toEqual([])

    // Said out loud rather than skipped: where the token is the inherited
    // colour, this spec has no opinion, and the set is derived so it can grow.
    const indistinguishable = measured
      .filter((m) => String(m.declared.slice(0, 3)) === String(inherited.slice(0, 3)))
      .map((m) => m.token)
    expect(
      indistinguishable,
      `on ${theme} these tokens equal --foreground ${rgb(inherited)}, so a probe cannot tell painted from inherited`,
    ).not.toContain("info")
  })
}
