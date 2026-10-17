# S72 — the palette literals a buyer reads, and four things S71's retro owes

Written 2026-10-17, after S71 (#237) merged as `6f0a8e7`. **Start here in a
fresh terminal.** This file is uncommitted on purpose: it rides into `main` with
S72's own PR, the way S70's and S71's briefs did. There is no closeout PR.

---

## 0. Two things settled at the end of S71 — read both before starting

### 0a. The Vercel preview decision is CLOSED. Do not re-raise it.

It had carried unresolved at the top of this block through S70 and S71. **The
owner settled it himself on 2026-10-17, in the Vercel dashboard**, and there is
nothing left to ask or implement.

What he set: **Project Settings → Git → Ignored Build Step → Behavior = "Only
build production"**, which runs Vercel's own
`if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi`.
Production Overrides left unset.

What that means for every sprint from here:

- **Branch pushes and PRs produce no Vercel build at all.** Expect no Vercel
  check on a PR. That is the new correct state — do not treat a missing Vercel
  check as a broken pipeline or try to restore it.
- **Merges to `main` still deploy production**, so the domain keeps following
  `main` by itself. Nothing about that changed, and it still must not be
  promoted or checked by hand.
- **GitHub Actions runs did not change** — still two per merge (`pull_request`
  and `push: main`). This removed Vercel build minutes only. If CI cost is
  raised again, that is the number to attack, not Vercel.

It settled both of his objections at once: nobody was viewing the previews, and
the "Vercel deploys before Actions finish" problem is moot for branches now that
branches do not deploy. The remaining production deploy fires on `push: main`,
which can only happen after a squash merge of a green PR — confirmed on S71's
own PR, where Vercel reported "Deployment has completed" while `app` was still
`pending`. That is why the setting was the fix rather than a deploy gate.

**Verify once, on this sprint's first push**: no Vercel check appears on the PR,
and a production deploy still runs on merge. If either is untrue, say so; do not
change the setting back.

### 0b. APPROVED: split `docs/next-steps.md`. Do it first, before the sprint work.

**The owner approved this on 2026-10-17** ("yes do the split in S72"). It is
decided — do not re-ask, and do not treat it as optional. It is not a gate; it
is scope.

**Do it as the first commit of the sprint, before section 2's work**, and the
reason is concrete: the palette sprint writes S72's own ledger row into
`docs/next-steps.md`. Split first and that row is written once, short, into the
new short file. Split last and you write a long row, then move it, then shorten
it — three passes over the thing the split exists to shrink.

Measured at the end of S71:

```
docs/next-steps.md        88.6 KB / 439 lines   (~22k tokens)
  the historical ledger   69.3 KB / 295 lines   = 78% of the file
  the snapshot bullet      4.7 KB               (~1.2k tokens, one bullet)
```

Every fresh terminal reads this file at step 0 — correctly; that is the design.
But 78% of what it pays for is historical sprint rows back to S0 that are almost
never needed, and the share grows every sprint. It is the compounding cost of
starting any session, and the largest single one.

**The proposal.** `docs/next-steps.md` keeps current state and the next-session
block (~100 lines). The historical rows move to `docs/sprint-ledger.md`, read
only when someone asks about a past sprint.
`qa/unit/docs/changelog-coverage.test.ts` reads the ledger by path, so it is a
one-line change there plus the guard pointing at the new file — and the guard
must be shown red on the real files after the move, not merely green.
Roughly a 75% cut to the fixed cost of starting a session, permanently.

**The related half, which costs nothing to fix.** One sprint is currently
described in **five** places: this handoff brief, the ledger row, the
next-session block, the What's New entry and the PR body. S71 wrote three
essay-length accounts of one sprint. The PR body is permanent, searchable and
already the fullest account, so:

- PR body stays canonical and detailed;
- the ledger row becomes **two sentences and a SHA**, not 400 words;
- the next-session block is **dropped into the handoff file**, since the two
  duplicate each other almost entirely;
- What's New stays the one customer-facing line it already is.

S71's own ledger row is the worst offender in the file and is a fair thing to
shorten first, as the worked example.

**What is not the waste**, so it does not get cut by mistake: the red-before-green
proof work. It is what caught `--warning` being under AA, the `momo-x` scan gap,
and two no-op experiments that would otherwise have read as passing guards. The
trimmable part there is only running three variants of one red where one would
do.

## 1. S71's merge SHA is owed, and that is by design

S71's ledger row reads `PENDING`, because a PR cannot record its own squash
commit. **Fill it in with `6f0a8e7`** — the sprint's first commit, confirmed from
`git log --oneline -1 origin/main` after a fetch. S71 did the same for S70
(`191fe86`). This is the only thing S71 leaves behind in the ledger.

## 2. The candidate: 127 palette literals, four files of them buyer-facing

S71 fixed three of 130 and left the rest as a named ratchet in
`qa/unit/theme/palette-literals.test.ts` — every file with its count, failing on
one more, on one in an unlisted file, and on a stale entry. The counts are
already measured, so this sprint is implementation, not discovery.

The buyer-facing four are the ones worth a sprint:

| File | Count | Notable |
|---|---|---|
| `components/contact/contact-form.tsx` | 7 | `text-emerald-300`, the same shape as the badge S66 fixed at 1.25:1 |
| `components/ui/toast.tsx` | 3 | `text-red-300`, `ring-red-400` |
| `features/products/components/product-reviews.tsx` | 3 | `text-amber-200` |
| `features/products/components/review-form.tsx` | 3 | `text-red-200` |

Plus `text-red-400` on both auth forms and `frame-scroll-hero.tsx` — the error
line a visitor sees when sign-in fails. The 20 admin and email files are staff
surfaces and can follow in their own sprint.

**Three things S71 learned that apply directly here.**

1. **Measure before assuming a literal is broken.** The listing's low-stock
   badge is a literal and reads **10.45:1**, because `bg-amber-500/90 text-black`
   inverts the problem. A sweep that replaced every literal on sight would have
   changed a passing colour.
2. **`--warning` and `--success` are now both single tokens held to the 4.5:1
   text floor**, and `--destructive` is a pair. Before reaching for any of them,
   read `app/globals.css`'s comments: they record which constraint produced which
   shape, and S71's whole result was that the pair shape did *not* apply to
   `--warning`. Do not copy a shape; measure what the new case is made of.
3. **The red for a token change is cheap and the red for a class change is not
   the same red.** A token can be correct and the utility paint nothing, if
   `--color-<name>` is missing from `@theme inline`. S71 proved both classes by
   deleting that line and watching the text inherit `--foreground` while the
   token still resolved — and axe *passes* that state. Only a browser can say.

## 3. Check which states a scan can reach, before writing a browser assertion

This is S71's sharpest finding and it will bite again on `contact-form.tsx`.

`qa/axe` had scanned a product detail page in **both themes since before S66**
and could never have caught S71's defect. Not a missing route — the wrong
*instance* of one. The scanned path is the first `/products/` URL in the sitemap,
and that is `momo-x`, the pre-order, where neither amber renders. The defect sat
on `momo-studio`, three entries down, served and visible the whole time.

So: `curl` the page and confirm the element is in the HTML before writing any
assertion about it, and when a page type has instances, **walk to the instance
that renders the state** rather than naming a slug. `qa/axe/accessibility.spec.ts`
now has two worked examples of the walk.

`contact-form.tsx`'s literals are on a **success message after submission** and
an error line — neither is on screen at rest, which is the S67 case exactly. Plan
for a unit measurement or a driven browser state, not a plain route scan.

## 4. Four things S71's retro owes, none of which had anywhere to ship

S71 merged before these were found, and the no-closeout-PR rule means they ride
here. Take them with the sprint above; all four are small.

1. **`ALLOW_COMMIT_ON_MAIN` disarms the new path rule too, and its name says
   nothing about that.** S71 added `refusalForPaths` to the same hook as the
   branch rule and gave it the same override, so `ALLOW_COMMIT_ON_MAIN=1`
   silently also permits committing `public/brand/herman.jpg`. Found by using the
   override to test the branch rule from `main` and watching the headshot commit
   go through (reset immediately; nothing was pushed). Low severity — `.gitignore`
   is unaffected and still stops `git add -A` — but the override is coarser than
   its name, and a deliberate override of one rule should not disarm an unrelated
   one. Either give the path rule its own override or rename the shared one.
   `scripts/lib/branch-guard.mjs`.
2. **`pnpm build` fails `EPERM` while a dev server is running**, because
   `prisma generate` cannot rename `query_engine-windows.dll.node` while the
   server holds it. S71 lost a cycle to this. Stopping the dev server fixes it,
   and `pnpm health` now names the pid holding port 3000. Not in
   `.agents/skills/sprint-workflow/references/troubleshooting.md` — add it.
3. **Two test-count conventions are in circulation and the ledger mixes them.**
   `pnpm facts` counts browser specs from a Playwright `--list` that excludes the
   `app-identity` setup project; `pnpm test:smoke|seo|axe` print one more per
   layer because they run it. So S71 is truthfully "smoke 31, seo 19, axe 43"
   (run output, the convention every ledger row uses) and "smoke 30, seo 18, axe
   42" in `lib/facts/snapshot.json` and on the exports. S71 spent time
   reconciling 39-vs-38. Write the convention down once, in `sprint-workflow`
   step 3 beside the facts paragraph.
4. **When you break something to watch a guard go red, confirm the break
   landed.** Two of S71's `sed` experiments silently matched nothing — the guard
   "passed" while the file was untouched, which proves nothing and reads exactly
   like a guard that works. Caught by diffing. A one-line rule for
   `sprint-workflow` step 3, next to "a guard is not green until it has been red
   on the real files": a no-op experiment is not a red, so assert the edit
   changed the file before trusting the result.

Also worth knowing: S71 hit the S51 hazard the skill already warns about —
`git checkout -- <file>` to undo a red experiment also deleted the uncommitted
fix in that file, and the fix had to be reapplied. The rule is already written in
step 3. The practice that makes it moot is committing before experimenting, which
S71 then did for the rest of the sprint. No new rule needed, only the habit.

## 5. State

- `main` is at S71 (#237, `6f0a8e7`).
- Green on S71's tree: tsc, lint, `pnpm arch` (no regressions), unit **1913**,
  integration **83**, smoke **31**, seo **19**, axe **43**, `pnpm build`, and all
  73 exports re-rendered.
- Architecture metrics unmoved: `deepImports 0`, `libToFeatures 0`,
  `routePropDrilling 0`, `useEffect 32`, `anyTypes 0`, `incrementers 3`,
  `clientComponents 150`, `largeFiles 21`.
- The domain follows `main` by itself — do not check it, do not offer to promote.
  Stripe stays in test mode; there is no go-live.
- The posting is the owner's own job and he is handling it. Do not open a sprint
  by proposing a post.
- Nothing in this repo is untracked on purpose any more. `public/brand/` holds
  four tracked files (wordmark and monogram, light and dark); the headshot was
  deleted on 2026-10-17 and is now both gitignored and refused by the hook.

## 6. How to run it

`.agents/skills/sprint-workflow/` from step 0. Branch
`v0/s72-<short-name>` off a freshly fetched `origin/main`. Test first.
**No standalone closeout PR** — S72's ledger row, its What's New entry, S71's
merge SHA (`6f0a8e7`) and the four retro items in section 4 all ride in S72's own
PR (skill step 6).

**There is no gate on this sprint, and nothing is waiting on the owner.**
Section 0a is closed and section 0b is approved. Do not open the sprint by
re-asking about either.

Order of work, which matters: **0b's split first** (so S72's ledger row is
written once into the short file), then section 2's palette literals, then the
four retro items in section 4. One PR, one push.
