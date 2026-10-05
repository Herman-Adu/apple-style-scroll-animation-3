import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeAuth } from "@/qa/fakes";

const auth = fakeAuth();
auth.install();

const m = vi.hoisted(() => ({
  sendEmail: vi.fn(async () => ({ ok: true as const, id: "mail_1" })),
  getTemplateBlocksByKey: vi.fn(async () => null),
  getBranding: vi.fn(async () => ({
    companyName: "Momo Audio",
    supportEmail: "help@example.com",
  })),
  recordLog: vi.fn(async () => undefined),
  fetchProductImageMap: vi.fn(async () => ({})),
}));

vi.mock("@/features/email/lib/adapters/sending/provider", () => ({
  sendEmail: m.sendEmail,
  isEmailConfigured: () => true,
}));

vi.mock("@/features/email/lib/domain/content/templates", () => ({
  testEmail: () => ({ subject: "Test", html: "<p>test</p>", text: "test" }),
  personalOfferEmail: () => ({
    subject: "Offer",
    html: "<p>offer</p>",
    text: "offer",
  }),
  orderConfirmationEmail: () => ({
    subject: "Order",
    html: "<p>order</p>",
    text: "order",
  }),
  businessOrderNotificationEmail: () => ({
    subject: "Business",
    html: "<p>business</p>",
    text: "business",
  }),
  lowStockAlertEmail: () => ({
    subject: "Low stock",
    html: "<p>stock</p>",
    text: "stock",
  }),
  refundConfirmationEmail: () => ({
    subject: "Refund",
    html: "<p>refund</p>",
    text: "refund",
  }),
  shippingConfirmationEmail: () => ({
    subject: "Shipping",
    html: "<p>shipping</p>",
    text: "shipping",
  }),
}));

vi.mock("@/features/email/lib/data/repo", () => ({
  getTemplateBlocksByKey: m.getTemplateBlocksByKey,
  getBranding: m.getBranding,
  recordLog: m.recordLog,
}));

vi.mock("@/features/products/server", () => ({
  fetchProductImageMap: m.fetchProductImageMap,
}));

async function actions() {
  return import("@/features/email/lib/actions/transactional");
}

describe("email transactional admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.session = null;
  });

  it("rejects a signed-out caller for getEmailConfigured", async () => {
    const { getEmailConfigured } = await actions();
    await expect(getEmailConfigured()).rejects.toThrow();
  });

  it("rejects a signed-out caller for sendTestEmail", async () => {
    const { sendTestEmail } = await actions();
    await expect(sendTestEmail({ to: "test@example.com" })).rejects.toThrow();
    expect(m.sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a signed-out caller for sendPersonalOffer", async () => {
    const { sendPersonalOffer } = await actions();
    await expect(
      sendPersonalOffer({
        to: "shopper@example.com",
        name: "Shopper",
        offer: { label: "VIP", kind: "percent", value: 10 },
      }),
    ).rejects.toThrow();
    expect(m.sendEmail).not.toHaveBeenCalled();
  });
});
