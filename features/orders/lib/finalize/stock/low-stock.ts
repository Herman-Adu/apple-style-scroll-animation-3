import "server-only";

import { after } from "next/server";

import { sendLowStockAlert } from "@/features/email";
import { getStoreSettingsAction } from "@/features/settings";

export type LowStockItem = {
  name: string;
  slug: string;
  stock: number;
  threshold: number;
  image?: string;
};

export function notifyLowStock(items: LowStockItem[]): void {
  if (items.length === 0) return;
  after(async () => {
    try {
      const settings = await getStoreSettingsAction();
      if (!settings.emailAlerts || !settings.supportEmail) {
        return;
      }
      await sendLowStockAlert({ to: settings.supportEmail, items });
    } catch {
      // Best-effort only.
    }
  });
}
