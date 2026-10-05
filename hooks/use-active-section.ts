"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const SECTION_OFFSET = 120;

type ActiveSectionInput = {
  presentIds: string[];
  offset: number;
  scrolledToBottom: boolean;
  getTop: (id: string) => number | null;
};

export function isScrolledToBottom(
  innerHeight: number,
  scrollY: number,
  scrollHeight: number,
): boolean {
  return innerHeight + scrollY >= scrollHeight - 2;
}

export function getActiveSectionId({
  presentIds,
  offset,
  scrolledToBottom,
  getTop,
}: ActiveSectionInput): string | null {
  if (presentIds.length === 0) return null;
  if (scrolledToBottom) return presentIds[presentIds.length - 1] ?? null;

  let current: string | null = null;
  for (const id of presentIds) {
    const top = getTop(id);
    if (top == null) continue;
    if (top <= offset) current = id;
    else break;
  }

  return current;
}

/**
 * Tracks which of the given section ids is currently in view.
 *
 * Uses a deterministic top-edge test rather than a middle-of-viewport band:
 * the active section is the last one whose top has scrolled above a line just
 * below the fixed header. This avoids the "off by one" you get with short
 * sections (where a mid-viewport band lands on the *next* section), and it
 * behaves correctly on pages whose sections are shorter than the viewport.
 *
 * Only ids that actually exist on the current page are considered, so a single
 * shared list across the whole nav is safe — off-page ids are ignored.
 */
export function useActiveSection(ids: string[]): string | null {
  const pathname = usePathname();
  const [activeId, setActiveId] = useState<string | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    // Sections present on this page, kept in nav (document) order.
    const present = ids.filter((id) => document.getElementById(id));
    if (present.length === 0) {
      queueMicrotask(() => setActiveId(null));
      return;
    }

    const compute = () => {
      const active = getActiveSectionId({
        presentIds: present,
        offset: SECTION_OFFSET,
        scrolledToBottom: isScrolledToBottom(
          window.innerHeight,
          window.scrollY,
          document.documentElement.scrollHeight,
        ),
        getTop: (id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          return el.getBoundingClientRect().top;
        },
      });

      setActiveId(active);
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
    // Re-run when the id set or the route changes (new page = new sections).
  }, [ids, key, pathname]);

  return activeId;
}
