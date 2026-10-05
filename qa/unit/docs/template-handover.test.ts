import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "@/qa/config/repo-root";

const read = (path: string) => readFileSync(join(REPO_ROOT, path), "utf8");

describe("S5 template handover docs", () => {
  it("adds a dedicated template handover runbook", () => {
    expect(existsSync(join(REPO_ROOT, "docs/template-handover.md"))).toBe(true);

    const handover = read("docs/template-handover.md");
    expect(handover).toContain("# Template handover");
    expect(handover).toContain("## Fork and rebrand checklist");
    expect(handover).toContain("## Environment variables to replace");
    expect(handover).toContain("## Keep vs delete before production");
  });

  it("adds a template-vs-live-product note at the top of README", () => {
    const readmeTop = read("README.md").split(/\r?\n/).slice(0, 20).join("\n");
    expect(readmeTop).toContain("template");
    expect(readmeTop).toContain("not a production go-live runbook");
  });

  it("documents the final S5 gap analysis in architecture health", () => {
    const health = read("docs/architecture-health.md");
    expect(health).toContain("## S5 final gap analysis");
    expect(health).toContain("Status: template handover complete");
  });

  it("closes the ledger with an explicit S5 row", () => {
    const ledger = read("docs/next-steps.md");
    expect(ledger).toContain("| S5");
    expect(ledger).toContain("Template handover");
  });

  it("tracks merged PR #138 in current state and sprint ledger", () => {
    const ledger = read("docs/next-steps.md");
    expect(ledger).toContain("PR #138");
    expect(ledger).toContain("| S11");
    expect(ledger).toContain("2b9af42");
  });

  it("tracks merged PR #139 in current state and sprint ledger", () => {
    const ledger = read("docs/next-steps.md");
    expect(ledger).toContain("PR #139");
    expect(ledger).toContain("| S12");
    expect(ledger).toContain("f8b27e3");
  });

  it("tracks merged PR #140 in current state and sprint ledger", () => {
    const ledger = read("docs/next-steps.md");
    expect(ledger).toContain("PR #140");
    expect(ledger).toContain("| S13");
    expect(ledger).toContain("b6f21cc");
  });

  it("tracks merged PR #141 in current state and sprint ledger", () => {
    const ledger = read("docs/next-steps.md");
    expect(ledger).toContain("PR #141");
    expect(ledger).toContain("| S14");
    expect(ledger).toContain("5464056");
  });
});
