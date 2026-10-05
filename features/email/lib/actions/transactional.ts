"use server";

import { sendEmail } from "../adapters/sending/provider";
import { personalOfferEmail, testEmail } from "../domain/content/templates";
import { getBranding, getTemplateBlocksByKey, recordLog } from "../data/repo";
import { getBaseUrl } from "@/lib/seo/site";
import { fetchProductImageMap } from "@/features/products/server";
import { requireAdmin } from "@/lib/auth/server";
import { getEmailConfigured as getProviderEmailConfigured } from "../adapters/sending/transactional";

/**
 * Final in-code fallback recipient for business notifications, used when neither
 * EMAIL_TO nor EMAIL_FROM is set in the environment. Points at the live
 * momo-audio.adudev.co.uk sending domain so test-environment order alerts
 * always land in a real inbox.
 */
/**
 * Server actions for transactional email. These are the only email entry points
 * the app calls — callers never touch the transport directly. Each returns a
 * result but callers treat email as fire-and-forget: a failed or skipped send
 * must never block an order or a stock update.
 *
 * Branding and (for customizable templates) block layouts are pulled from the
 * database so edits in the admin builder take effect immediately. If the DB is
 * unreachable, rendering falls back to the built-in system layout. Every send
 * is written to the email log for the Overview dashboard.
 */

export async function sendPersonalOffer(params: {
  to: string;
  name: string;
  offer: {
    label: string;
    kind: string;
    value?: number;
    expiresAt?: string;
    note?: string;
  };
}) {
  await requireAdmin();
  const shopUrl = `${getBaseUrl()}/products`;
  const [branding, blocks, products] = await Promise.all([
    getBranding(),
    getTemplateBlocksByKey("personal_offer"),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = personalOfferEmail({
    name: params.name,
    offer: params.offer,
    shopUrl,
    branding,
    blocks: blocks ?? undefined,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "personal_offer",
    type: "transactional",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}

/** Admin: report whether a Resend key is configured (server-side env read). */
export async function getEmailConfigured(): Promise<boolean> {
  await requireAdmin();
  return getProviderEmailConfigured();
}

/** Admin: send a test email to verify Resend + sending domain are working. */
export async function sendTestEmail(params: { to: string }) {
  await requireAdmin();
  const [branding, products] = await Promise.all([
    getBranding(),
    fetchProductImageMap(),
  ]);
  const { subject, html, text } = testEmail({
    branding,
    baseUrl: getBaseUrl(),
    products,
  });
  const result = await sendEmail({ to: params.to, subject, html, text });
  await recordLog({
    to: params.to,
    subject,
    templateKey: "test",
    type: "test",
    resendId: result.ok && result.id ? result.id : "",
    status: result.ok ? (result.skipped ? "skipped" : "sent") : "failed",
  });
  return result;
}
