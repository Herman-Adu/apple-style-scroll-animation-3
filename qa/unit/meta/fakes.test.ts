import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { fakeAuth, fakeCache, fakeDb, fakeEmail, fakeHttp } from "@/qa/fakes";
import { REPO_ROOT } from "@/qa/config/repo-root";

/**
 * The shared test-fakes kit (R1). Each fake stands in for one outside-world
 * seam, so integration tests stop hand-rolling their own vi.mock copies. The
 * last block is the guard: no test may mock those seams directly any more.
 */
describe("fakeDb", () => {
  it("runs both array and callback transactions against the fake models", async () => {
    const db = fakeDb({ thing: { count: async () => 3 } });
    expect(
      await db.prisma.$transaction([Promise.resolve(1), Promise.resolve(2)]),
    ).toEqual([1, 2]);
    expect(await db.prisma.$transaction((tx) => tx.thing.count())).toBe(3);
    expect(db.prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("replaces @/lib/db/prisma once installed", async () => {
    const db = fakeDb({ thing: { count: async () => 7 } });
    db.install();
    const { prisma } = await import("@/lib/db/prisma");
    expect(prisma).toBe(db.prisma);
  });
});

describe("fakeCache", () => {
  it("records path and tag revalidations through next/cache", async () => {
    const cache = fakeCache();
    cache.install();
    const next = await import("next/cache");
    next.revalidatePath("/a");
    next.revalidateTag("products", "max");
    expect(cache.revalidatePath).toHaveBeenCalledWith("/a");
    expect(cache.revalidateTag).toHaveBeenCalledWith("products", "max");
  });
});

describe("fakeAuth", () => {
  it("applies the real admin rule to whatever session the test sets", async () => {
    const auth = fakeAuth();
    await expect(auth.requireAdmin()).rejects.toThrow();
    auth.session = { email: "shopper@x.com", role: "customer" };
    await expect(auth.requireAdmin()).rejects.toThrow();
    auth.session = { email: "designer@adudev.co.uk", role: "admin" };
    await expect(auth.requireAdmin()).resolves.toMatchObject({ role: "admin" });
  });

  it("uses the real lock rule with the given lockers", async () => {
    const auth = fakeAuth({
      lockers: ["designer@adudev.co.uk"],
      session: { email: "content@adudev.co.uk", role: "admin" },
    });
    expect(await auth.getServerCanLockBlocks()).toBe(false);
    auth.session = { email: "designer@adudev.co.uk", role: "admin" };
    expect(await auth.getServerCanLockBlocks()).toBe(true);
  });
});

describe("fakeEmail", () => {
  it("collects sent mail in an outbox and can fail the next send", async () => {
    const email = fakeEmail();
    expect(
      await email.sendEmail({
        to: "a@x.com",
        subject: "Hi",
        html: "<p>Hi</p>",
      }),
    ).toMatchObject({ ok: true });
    email.failNext("boom");
    expect(
      await email.sendEmail({ to: "b@x.com", subject: "Yo", html: "" }),
    ).toEqual({ ok: false, error: "boom" });
    expect(email.outbox.map((m) => m.to)).toEqual(["a@x.com"]);
  });
});

describe("fakeHttp", () => {
  it("answers scripted routes, 404s unknown ones and refuses other hosts", async () => {
    const http = fakeHttp("https://cms.test");
    http.on("GET", "/api/products", () => Response.json({ data: [1] }));
    http.install();
    expect(await (await fetch("https://cms.test/api/products")).json()).toEqual(
      { data: [1] },
    );
    expect((await fetch("https://cms.test/api/missing")).status).toBe(404);
    await expect(fetch("https://elsewhere.test/")).rejects.toThrow(
      /unexpected request/,
    );
    expect(http.requests).toHaveLength(2);
  });
});

describe("guard: seams are only faked through the kit", () => {
  const seams =
    /vi\.mock\(\s*["'](@\/lib\/db\/prisma|next\/cache|@\/lib\/auth\/server|@\/features\/email\/provider)["']/;
  const qaRoot = path.join(REPO_ROOT, "qa");
  const testFiles = readdirSync(qaRoot, { recursive: true, encoding: "utf8" })
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => path.join(qaRoot, f));

  it.each(testFiles.map((f) => [path.relative(REPO_ROOT, f), f]))(
    "%s has no direct seam vi.mock",
    (_rel, file) => {
      expect(readFileSync(file, "utf8")).not.toMatch(seams);
    },
  );
});
