import * as React from "react";

export const MOBILE_BREAKPOINT = 768;

type MatchMediaLike = (query: string) => {
  addEventListener: (type: "change", listener: () => void) => void;
  removeEventListener: (type: "change", listener: () => void) => void;
};

export function getIsMobileSnapshot(width: number): boolean {
  return width < MOBILE_BREAKPOINT;
}

export function subscribeIsMobile(
  matchMedia: MatchMediaLike,
  onStoreChange: () => void,
): () => void {
  const mql = matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      return subscribeIsMobile(window.matchMedia, onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return false;
      return getIsMobileSnapshot(window.innerWidth);
    },
    () => false,
  );
}
