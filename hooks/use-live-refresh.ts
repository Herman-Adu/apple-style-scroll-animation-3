"use client";

import { useEffect, useEffectEvent } from "react";

export type LiveRefreshEnvironment = {
  addWindowEventListener: (type: "focus", listener: () => void) => void;
  removeWindowEventListener: (type: "focus", listener: () => void) => void;
  addDocumentEventListener: (
    type: "visibilitychange",
    listener: () => void,
  ) => void;
  removeDocumentEventListener: (
    type: "visibilitychange",
    listener: () => void,
  ) => void;
  getVisibilityState: () => DocumentVisibilityState;
  setInterval: (handler: () => void, timeout: number) => number;
  clearInterval: (id: number) => void;
};

const browserLiveRefreshEnvironment: LiveRefreshEnvironment = {
  addWindowEventListener: (type, listener) => {
    window.addEventListener(type, listener);
  },
  removeWindowEventListener: (type, listener) => {
    window.removeEventListener(type, listener);
  },
  addDocumentEventListener: (type, listener) => {
    document.addEventListener(type, listener);
  },
  removeDocumentEventListener: (type, listener) => {
    document.removeEventListener(type, listener);
  },
  getVisibilityState: () => document.visibilityState,
  setInterval: (handler, timeout) => window.setInterval(handler, timeout),
  clearInterval: (id) => window.clearInterval(id),
};

export function startLiveRefreshLoop(
  environment: LiveRefreshEnvironment,
  onTick: () => void,
  intervalMs: number,
): () => void {
  const id = environment.setInterval(() => {
    if (environment.getVisibilityState() === "visible") onTick();
  }, intervalMs);

  const onFocus = () => onTick();
  const onVisible = () => {
    if (environment.getVisibilityState() === "visible") onTick();
  };

  environment.addWindowEventListener("focus", onFocus);
  environment.addDocumentEventListener("visibilitychange", onVisible);

  return () => {
    environment.clearInterval(id);
    environment.removeWindowEventListener("focus", onFocus);
    environment.removeDocumentEventListener("visibilitychange", onVisible);
  };
}

/**
 * Re-run `refresh` on an interval while the tab is visible, and immediately
 * when the tab regains focus/visibility — so open dashboards and storefront
 * pages pick up changes made elsewhere (a sale, a refund, an admin edit)
 * without a manual reload.
 */
export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  intervalMs = 20000,
): void {
  const onTick = useEffectEvent(() => void refresh());

  useEffect(() => {
    return startLiveRefreshLoop(
      browserLiveRefreshEnvironment,
      onTick,
      intervalMs,
    );
  }, [intervalMs]);
}
