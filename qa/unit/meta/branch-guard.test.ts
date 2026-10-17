import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_PATHS,
  HOOKS_DIR,
  OVERRIDE,
  PROTECTED_BRANCHES,
  refusalFor,
  refusalForPaths,
} from "@/scripts/lib/branch-guard.mjs";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * `AGENTS.md` non-negotiable 1 is "never commit to `main`", and until S53 it was
 * only ever a sentence: nothing stopped the commit, and S52's closeout landed on
 * local `main` before its branch existed. The content was identical to the
 * squash that followed, so no review, no check and no diff would ever have shown
 * it - the only trace was a local ref one commit ahead.
 *
 * A rule a machine can check should not be left to memory, so the decision lives
 * here as a pure function and the hook is a two-line shim around it. The wiring
 * tests below exist because an uninstalled hook fails open and says nothing.
 */
describe("committing on a protected branch", () => {
  it("refuses `main`, naming the branch, the rule and the way out", () => {
    const refusal = refusalFor("main");
    expect(refusal).toContain("main");
    expect(refusal).toContain("AGENTS.md");
    expect(refusal).toContain(OVERRIDE);
  });

  it("allows a sprint branch", () => {
    expect(refusalFor("v0/s53-branch-guard")).toBeNull();
  });

  it("allows a detached HEAD, so a rebase or bisect is never blocked", () => {
    expect(refusalFor(null)).toBeNull();
  });

  it("stands aside when the override is set, so it can never be the reason work is stuck", () => {
    expect(refusalFor("main", { [OVERRIDE]: "1" })).toBeNull();
  });

  it("ignores an override set to nothing", () => {
    expect(refusalFor("main", { [OVERRIDE]: "" })).not.toBeNull();
  });

  it("compares branch names the way git does, exactly", () => {
    expect(refusalFor("Main")).toBeNull();
  });

  it("protects `main` and nothing else, since every sprint branch is disposable", () => {
    expect(PROTECTED_BRANCHES).toEqual(["main"]);
  });
});

/**
 * The second rule the same hook carries, from S70's retro: a file that must not
 * be in a public repo should not depend on someone spotting it in a diff.
 * `git add -A` staged the owner's headshot during S70 and it was caught by eye;
 * the same pattern had already put `banner-images-next-session.md` on `main` in
 * S69a. The file is deleted now, which retires the file and not the pattern -
 * the next banner sprint writes it back to the same path.
 */
describe("committing a forbidden path", () => {
  it("refuses the headshot, naming the file and how to unstage it", () => {
    const refusal = refusalForPaths(["app/globals.css", "public/brand/herman.jpg"]);
    expect(refusal).toContain("public/brand/herman.jpg");
    expect(refusal).toContain("git restore --staged public/brand/herman.jpg");
    expect(refusal).toContain(OVERRIDE);
  });

  it("says nothing about the files staged alongside it", () => {
    expect(refusalForPaths(["app/globals.css", "public/brand/herman.jpg"])).not.toContain("globals.css");
  });

  it("allows a commit that does not stage it", () => {
    expect(refusalForPaths(["app/globals.css", "public/brand/adudev-wordmark-dark.png"])).toBeNull();
  });

  it("allows the wordmarks and monograms in the same folder, which are tracked on purpose", () => {
    const brand = execFileSync("git", ["ls-files", "public/brand"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((line) => line.trim() !== "");
    // Four files, and the guard is a path list rather than a folder rule so it
    // cannot start refusing them.
    expect(brand.length).toBeGreaterThan(0);
    expect(refusalForPaths(brand)).toBeNull();
  });

  it("allows an empty index, so the hook is never the reason a commit cannot be made", () => {
    expect(refusalForPaths([])).toBeNull();
    expect(refusalForPaths(undefined)).toBeNull();
  });

  it("stands aside when the override is set, the same way the branch rule does", () => {
    expect(refusalForPaths(["public/brand/herman.jpg"], { [OVERRIDE]: "1" })).toBeNull();
  });

  it("is carried by .gitignore too, which is the line that stops `git add -A`", () => {
    const ignore = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");
    for (const path of FORBIDDEN_PATHS) {
      expect(ignore, `${path} missing from .gitignore`).toContain(path);
    }
  });

  it("is asked by the hook, not only exported", () => {
    // The rule is pure and the hook is a shim; a rule the shim never calls is
    // a test passing over a guard that does nothing.
    const hook = readFileSync(join(REPO_ROOT, "scripts/pre-commit.mjs"), "utf8");
    expect(hook).toContain("refusalForPaths");
    expect(hook).toContain("--cached");
  });
});

/**
 * A hook that is not installed fails open. These check the three things that
 * have to be true for the guard to run in a fresh clone.
 */
describe("the hook is wired", () => {
  const packageJson = JSON.parse(
    readFileSync(join(REPO_ROOT, "package.json"), "utf8"),
  );

  it("ships the hook in a tracked directory", () => {
    const hook = join(REPO_ROOT, HOOKS_DIR, "pre-commit");
    expect(existsSync(hook)).toBe(true);
    expect(readFileSync(hook, "utf8")).toContain("scripts/pre-commit.mjs");
  });

  it("tracks the hook as executable, or it never runs on macOS or Linux", () => {
    const entry = execFileSync(
      "git",
      ["ls-files", "--stage", `${HOOKS_DIR}/pre-commit`],
      { cwd: REPO_ROOT, encoding: "utf8" },
    );
    expect(entry.split(" ")[0]).toBe("100755");
  });

  it("pins the hook to LF, or `#!/bin/sh` breaks wherever autocrlf is on", () => {
    const attributes = execFileSync(
      "git",
      ["check-attr", "eol", "--", `${HOOKS_DIR}/pre-commit`],
      { cwd: REPO_ROOT, encoding: "utf8" },
    );
    expect(attributes.trim()).toMatch(/eol: lf$/);
  });

  it("installs the hooks path on every install", () => {
    expect(packageJson.scripts.postinstall).toContain(
      "node scripts/install-hooks.mjs",
    );
    expect(readFileSync(join(REPO_ROOT, "scripts/install-hooks.mjs"), "utf8")).toContain(
      "core.hooksPath",
    );
  });

  it("still has a rule to enforce", () => {
    expect(readFileSync(join(REPO_ROOT, "AGENTS.md"), "utf8")).toContain(
      "Never commit to `main`",
    );
  });
});
