import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getToastSnapshot,
  resetToastStoreForTests,
  subscribeToastStore,
  toast,
} from "@/hooks/use-toast";

describe("use-toast store", () => {
  beforeEach(() => {
    resetToastStoreForTests();
  });

  it("notifies subscribers and supports unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToastStore(listener);

    toast({ title: "First" });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getToastSnapshot().toasts).toHaveLength(1);

    unsubscribe();
    toast({ title: "Second" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("always exposes the latest snapshot", () => {
    const created = toast({ title: "Snapshot" });
    expect(getToastSnapshot().toasts[0]?.id).toBe(created.id);

    created.dismiss();
    expect(getToastSnapshot().toasts[0]?.open).toBe(false);
  });
});
