import { isEmailConfigured, sendEmail } from "./provider";
import {
  orderConfirmationEmail,
  businessOrderNotificationEmail,
  lowStockAlertEmail,
  backInStockEmail,
  refundConfirmationEmail,
  shippingConfirmationEmail,
  type LowStockEmailItem,
} from "../../domain/content/templates";
import {
  getBranding,
  getTemplateBlocksByKey,
  recordLog,
} from "../../data/repo";
import type { Order } from "@/features/orders";
import { getBaseUrl } from "@/lib/seo/site";
import { fetchProductImageMap } from "@/features/products/server";

/**
 * Final in-code fallback recipient for business notifications, used when neither
 * EMAIL_TO nor EMAIL_FROM is set in the environment. Points at the live
 * momo-audio.adudev.co.uk sending domain so test-environment order alerts
 * always land in a real inbox.
 */
const DEFAULT_ADMIN_EMAIL = "admin@momo-audio.adudev.co.uk";

export async function sendOrderConfirmation(params: {
  to: string;
  name: string;
  order: Order;
}) {
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("order_confirmation"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = orderConfirmationEmail({
    name: params.name,
    order: params.order,
    branding,
    blocks: blocks ?? undefined,
    shopUrl: `${getBaseUrl()}/products`,
    orderUrl: `${getBaseUrl()}/account?tab=orders`,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "order_confirmation",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

export async function sendLowStockAlert(params: {
  to: string;
  items: LowStockEmailItem[];
}) {
  if (params.items.length === 0)
    return {
      ok: true as const,
      id: null,
      skipped: true as const,
      reason: "no items",
    };
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("low_stock"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = lowStockAlertEmail({
    items: params.items,
    branding,
    blocks: blocks ?? undefined,
    adminUrl: `${getBaseUrl()}/admin`,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "low_stock",
    type: "transactional",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

/**
 * One customer's back-in-stock alert. Every attempt lands in the email log,
 * a failure included, and the result is returned rather than thrown so the
 * restock that triggered it is never blocked.
 */
export async function sendBackInStockEmail(params: {
  to: string;
  productName: string;
  productSlug: string;
  unsubscribeUrl: string;
}) {
  const baseUrl = getBaseUrl();
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("back_in_stock"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = backInStockEmail({
    productName: params.productName,
    productSlug: params.productSlug,
    productUrl: `${baseUrl}/products/${params.productSlug}`,
    unsubscribeUrl: params.unsubscribeUrl,
    branding,
    blocks: blocks ?? undefined,
    baseUrl,
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "back_in_stock",
    type: "transactional",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

export async function sendOrderNotification(params: {
  order: Order;
  customerName?: string;
}) {
  const to =
    process.env.EMAIL_TO || process.env.EMAIL_FROM || DEFAULT_ADMIN_EMAIL;
  if (!to)
    return {
      ok: true as const,
      id: null,
      skipped: true as const,
      reason: "no recipient configured",
    };
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("order_notification"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = businessOrderNotificationEmail({
    order: params.order,
    customerName: params.customerName,
    branding,
    blocks: blocks ?? undefined,
    adminUrl: `${getBaseUrl()}/admin`,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to, subject, html, text });
  await recordLog({
    to,
    subject,
    templateKey: "order_notification",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

export async function sendRefundConfirmation(params: {
  to: string;
  name: string;
  order: Order;
  amount: number;
  isFullRefund: boolean;
}) {
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("refund_confirmation"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = refundConfirmationEmail({
    name: params.name,
    order: params.order,
    amount: params.amount,
    isFullRefund: params.isFullRefund,
    branding,
    blocks: blocks ?? undefined,
    orderUrl: `${getBaseUrl()}/account?tab=orders`,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "refund_confirmation",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

export async function sendShippingConfirmation(params: {
  to: string;
  name: string;
  order: Order;
}) {
  const [branding, products] = await Promise.all([
    getBranding(),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = shippingConfirmationEmail({
    name: params.name,
    order: params.order,
    branding,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "shipping_confirmation",
    type: "transactional",
    relatedId: params.order.number,
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

export async function getEmailConfigured(): Promise<boolean> {
  return isEmailConfigured();
}
