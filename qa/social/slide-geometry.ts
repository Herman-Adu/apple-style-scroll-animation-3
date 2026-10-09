import type { Page } from "@playwright/test"

/**
 * Every slide on the page whose content is drawn over its own signature.
 *
 * This is how the old site map shipped — three columns of routes running under
 * the AduDev footer — and how the slide that replaced it overflowed again on
 * the first render.
 *
 * The obvious check, `scrollHeight > clientHeight` on the page frame, does not
 * see it and was tried first: the frame is `overflow-hidden` and the body is a
 * flex child, so both heights stay equal at 1350 while content sits 88px past
 * the footer. Comparing painted geometry is what actually catches it.
 *
 * A slide with no `<footer>` is reported rather than skipped. Returning early
 * on a missing footer would reintroduce exactly the fault this replaced: a
 * check that reports green while seeing nothing.
 */
export async function signatureOverruns(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-social-asset]")).flatMap((slide) => {
      const id = slide.getAttribute("data-social-asset")
      const footer = slide.querySelector("footer")
      if (!footer) return [`${id}: has no signature footer, so nothing can be measured against it`]

      const footerTop = footer.getBoundingClientRect().top
      let worst = { what: "", over: Number.NEGATIVE_INFINITY }
      for (const node of Array.from(slide.querySelectorAll("*"))) {
        if (node === footer || footer.contains(node)) continue
        const box = node.getBoundingClientRect()
        if (box.height === 0) continue
        const over = box.bottom - footerTop
        if (over > worst.over) worst = { what: node.tagName.toLowerCase(), over: Math.round(over) }
      }
      return worst.over > 0 ? [`${id}: ${worst.what} overruns the footer by ${worst.over}px`] : []
    }),
  )
}
