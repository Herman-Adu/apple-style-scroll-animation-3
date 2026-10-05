import { describe, expect, it, vi } from "vitest";

import {
  MOBILE_BREAKPOINT,
  getIsMobileSnapshot,
  subscribeIsMobile,
} from "@/hooks/use-mobile";

type MockMediaQueryList = {
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
  trigger: () => void;
};

function createMatchMediaMock() {
  let listener: (() => void) | null = null;
  const mql: MockMediaQueryList = {
    addEventListener: (_type, next) => {
      listener = next;
    },
    removeEventListener: (_type, next) => {
      if (listener === next) listener = null;
    },
    trigger: () => {
      listener?.();
    },
  };

  const matchMedia = vi.fn((_query: string) => mql);
  return { matchMedia, mql };
}

describe("use-mobile store helpers", () => {
  it("reads snapshot from innerWidth", () => {
    expect(getIsMobileSnapshot(MOBILE_BREAKPOINT - 1)).toBe(true);
    expect(getIsMobileSnapshot(MOBILE_BREAKPOINT)).toBe(false);
  });

  it("subscribes and unsubscribes a change listener", () => {
    const { matchMedia, mql } = createMatchMediaMock();
    const onStoreChange = vi.fn();

    const unsubscribe = subscribeIsMobile(matchMedia, onStoreChange);
    expect(matchMedia).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    mql.trigger();
    expect(onStoreChange).toHaveBeenCalledTimes(1);

    unsubscribe();
    mql.trigger();
    expect(onStoreChange).toHaveBeenCalledTimes(1);
  });
});
