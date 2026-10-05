import { describe, expect, it, vi } from "vitest";

import { startLiveRefreshLoop, type LiveRefreshEnvironment } from "@/hooks/use-live-refresh";

type Listeners = {
  focus?: () => void;
  visibilitychange?: () => void;
};

function createEnvironment(visibilityState: DocumentVisibilityState = "visible") {
  const listeners: Listeners = {};
  let intervalCallback: (() => void) | null = null;

  const env: LiveRefreshEnvironment = {
    addWindowEventListener: (_type, listener) => {
      listeners.focus = listener;
    },
    removeWindowEventListener: (_type, listener) => {
      if (listeners.focus === listener) listeners.focus = undefined;
    },
    addDocumentEventListener: (_type, listener) => {
      listeners.visibilitychange = listener;
    },
    removeDocumentEventListener: (_type, listener) => {
      if (listeners.visibilitychange === listener) listeners.visibilitychange = undefined;
    },
    getVisibilityState: () => visibilityState,
    setInterval: (callback) => {
      intervalCallback = callback;
      return 1;
    },
    clearInterval: vi.fn(),
  };

  return {
    env,
    setVisibilityState: (next: DocumentVisibilityState) => {
      visibilityState = next;
    },
    runInterval: () => intervalCallback?.(),
    triggerFocus: () => listeners.focus?.(),
    triggerVisibilityChange: () => listeners.visibilitychange?.(),
    clearInterval: env.clearInterval,
    hasFocusListener: () => typeof listeners.focus === "function",
    hasVisibilityListener: () => typeof listeners.visibilitychange === "function",
  };
}

describe("use-live-refresh helpers", () => {
  it("ticks on interval only while visible", () => {
    const onTick = vi.fn();
    const fixture = createEnvironment("visible");

    startLiveRefreshLoop(fixture.env, onTick, 20000);
    fixture.runInterval();
    expect(onTick).toHaveBeenCalledTimes(1);

    fixture.setVisibilityState("hidden");
    fixture.runInterval();
    expect(onTick).toHaveBeenCalledTimes(1);
  });

  it("ticks on focus and on visible transitions", () => {
    const onTick = vi.fn();
    const fixture = createEnvironment("hidden");

    startLiveRefreshLoop(fixture.env, onTick, 20000);
    fixture.triggerFocus();
    expect(onTick).toHaveBeenCalledTimes(1);

    fixture.triggerVisibilityChange();
    expect(onTick).toHaveBeenCalledTimes(1);

    fixture.setVisibilityState("visible");
    fixture.triggerVisibilityChange();
    expect(onTick).toHaveBeenCalledTimes(2);
  });

  it("unsubscribes listeners and clears interval on cleanup", () => {
    const onTick = vi.fn();
    const fixture = createEnvironment("visible");

    const cleanup = startLiveRefreshLoop(fixture.env, onTick, 20000);
    expect(fixture.hasFocusListener()).toBe(true);
    expect(fixture.hasVisibilityListener()).toBe(true);

    cleanup();
    expect(fixture.clearInterval).toHaveBeenCalledWith(1);
    expect(fixture.hasFocusListener()).toBe(false);
    expect(fixture.hasVisibilityListener()).toBe(false);
  });
});
