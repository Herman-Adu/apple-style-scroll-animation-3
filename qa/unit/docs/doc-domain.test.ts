import { describe, expect, it } from "vitest";
import {
  canViewDoc,
  DOC_AUDIENCES,
  DOC_CATEGORIES,
  DOC_CATEGORY_AUDIENCE,
  getDocHeadings,
  groupDocsByAudienceAndCategory,
  slugifyHeading,
  toDocSummary,
  visibleDocs,
} from "@/features/docs";
import { docs } from "@/features/docs/content";

describe("docs domain public API", () => {
  it("slugifies headings into stable anchor ids", () => {
    expect(slugifyHeading("  API & Integrations: V2  ")).toBe(
      "api-integrations-v2",
    );
  });

  it("derives headings with matching slug ids", () => {
    const sample = {
      ...docs[0],
      body: [
        { type: "paragraph" as const, text: "intro" },
        { type: "heading" as const, text: "First Section" },
        { type: "heading" as const, text: "Second Section" },
      ],
    };

    expect(getDocHeadings(sample)).toEqual([
      { id: "first-section", text: "First Section" },
      { id: "second-section", text: "Second Section" },
    ]);
  });

  it("keeps searchText out by default and includes it when requested", () => {
    const doc = docs[0];

    expect(toDocSummary(doc)).not.toHaveProperty("searchText");

    const withBody = toDocSummary(doc, true);
    expect(withBody.searchText).toBeTypeOf("string");
    expect(withBody.searchText?.length).toBeGreaterThan(0);
  });

  it("enforces owner/admin/public access rules consistently", () => {
    const ownerDoc = { access: "owner" as const };
    const adminDoc = { access: "admin" as const };
    const publicDoc = { access: "public" as const };

    const owner = { isAdmin: true, isOwner: true };
    const admin = { isAdmin: true, isOwner: false };
    const visitor = { isAdmin: false, isOwner: false };

    expect(canViewDoc(ownerDoc, owner)).toBe(true);
    expect(canViewDoc(ownerDoc, admin)).toBe(false);
    expect(canViewDoc(adminDoc, admin)).toBe(true);
    expect(canViewDoc(adminDoc, visitor)).toBe(false);
    expect(canViewDoc(publicDoc, visitor)).toBe(true);
  });

  it("filters visible docs with the same access rule", () => {
    const items = [
      { access: "public" as const, id: "pub" },
      { access: "admin" as const, id: "adm" },
      { access: "owner" as const, id: "own" },
    ];

    const idsForAdmin = visibleDocs(items, {
      isAdmin: true,
      isOwner: false,
    }).map((item) => item.id);

    const idsForOwner = visibleDocs(items, {
      isAdmin: true,
      isOwner: true,
    }).map((item) => item.id);

    expect(idsForAdmin).toEqual(["pub", "adm"]);
    expect(idsForOwner).toEqual(["pub", "adm", "own"]);
  });

  it("groups docs by audience and category in canonical order", () => {
    const summaries = docs.slice(0, 8).map((doc) => toDocSummary(doc));
    const grouped = groupDocsByAudienceAndCategory(summaries);

    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped[0].audience).toBe(DOC_AUDIENCES[0]);

    for (const audienceGroup of grouped) {
      for (const categoryGroup of audienceGroup.categories) {
        expect(DOC_CATEGORIES).toContain(categoryGroup.category);
        expect(DOC_CATEGORY_AUDIENCE[categoryGroup.category]).toBe(
          audienceGroup.audience,
        );
      }
    }
  });
});
