"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  LifeBuoy,
  Loader2,
  Lock,
  MessageSquare,
  Newspaper,
  Star as StarIcon,
} from "lucide-react";
import { enquiryTypes } from "@/features/contact";
import { products } from "@/features/products";
import { submitEnquiryAction } from "@/app/contact/actions";
import type { EnquiryField, EnquiryType } from "@/features/contact";
import { reviewsProvider } from "@/features/reviews";
import { useAuth } from "@/lib/auth/adapters/auth-context";
import { StarRating } from "./star-rating";
import { cn } from "@/lib/utils";

const iconMap = {
  message: MessageSquare,
  lifebuoy: LifeBuoy,
  star: StarIcon,
  building: Building2,
  newspaper: Newspaper,
} as const;

const steps = ["Topic", "Your details", "Details", "Review"];

const inputClass =
  "w-full rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 outline-none transition-colors focus:border-foreground/30";
const labelClass =
  "mb-2 block text-xs uppercase tracking-[0.15em] text-foreground/50";

function resolveOptions(field: EnquiryField): string[] {
  if (field.optionsSource === "products") return products.map((p) => p.name);
  return field.options ?? [];
}

function slugForProductName(name: string): string | undefined {
  return products.find((p) => p.name === name)?.slug;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ContactForm() {
  const { user, status } = useAuth();
  const [step, setStep] = useState(0);
  // Derive initial topic and values from the URL search params so we don't
  // synchronously set state inside effects when the component mounts.
  const [typeId, setTypeId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      return topic && enquiryTypes.some((t) => t.id === topic) ? topic : null;
    } catch {
      return null;
    }
  });

  const [values, setValues] = useState<Record<string, string | number>>(() => {
    if (typeof window === "undefined")
      return {} as Record<string, string | number>;
    try {
      const params = new URLSearchParams(window.location.search);
      const topic = params.get("topic");
      const product = params.get("product");
      if (topic && product && enquiryTypes.some((t) => t.id === topic)) {
        const hasProductField = enquiryTypes
          .find((t) => t.id === topic)
          ?.fields.some((f) => f.name === "product");
        if (hasProductField)
          return { product } as Record<string, string | number>;
      }
      return {} as Record<string, string | number>;
    } catch {
      return {} as Record<string, string | number>;
    }
  });

  // Name/email are shown using fallbacks from `user` when the local state
  // is empty; avoid setting state from within an effect to prevent cascading
  // renders. Inputs remain controlled once the user types.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Honeypot: hidden from real users; only bots fill it.
  const [website, setWebsite] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // NOTE: avoid setting state synchronously inside effects to prevent
  // cascading renders. We derive initial `typeId` and `values` from the
  // URL at construction time above, and render `name`/`email` with fallbacks
  // from `user` when the local state is empty.

  const selectedType: EnquiryType | undefined = useMemo(
    () => enquiryTypes.find((t) => t.id === typeId),
    [typeId],
  );

  // A topic is "locked" when it requires an account and the viewer is not
  // authenticated. While auth is still resolving we treat it as locked too, so
  // the flow never briefly exposes a gated form before the session loads.
  const requiresAccount = selectedType?.access === "account";
  const locked = requiresAccount && status !== "authenticated";
  const showGate = requiresAccount && status === "unauthenticated";
  const signInHref = typeId
    ? `/sign-in?redirect=${encodeURIComponent(`/contact?topic=${typeId}`)}`
    : "/sign-in";

  function setField(nameKey: string, value: string | number) {
    setValues((prev) => ({ ...prev, [nameKey]: value }));
  }

  function stepValid(index: number): boolean {
    if (index === 0) return !!typeId;
    if (index === 1) return name.trim().length > 1 && isEmail(email);
    if (index === 2) {
      if (!selectedType) return false;
      return selectedType.fields.every((f) => {
        if (!f.required) return true;
        const v = values[f.name];
        if (f.type === "rating") return typeof v === "number" && v > 0;
        return typeof v === "string" && v.trim().length > 0;
      });
    }
    return true;
  }

  function goNext() {
    // Never advance past topic selection into a gated topic while signed out.
    if (step === 0 && locked) {
      setTouched(true);
      return;
    }
    if (!stepValid(step)) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function goBack() {
    setTouched(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!selectedType) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitEnquiryAction({
        type: selectedType.id,
        name: name.trim(),
        email: email.trim(),
        fields: values,
        website,
      });

      if (!res.ok) {
        setError(res.error ?? "Something went wrong. Please try again.");
        return;
      }

      // A review enquiry also becomes a public product review.
      if (selectedType.id === "review") {
        const productSlug = slugForProductName(String(values.product ?? ""));
        if (productSlug) {
          await reviewsProvider.add({
            productSlug,
            author: name.trim(),
            avatarUrl: user?.profile.avatarUrl,
            rating: Number(values.rating) || 0,
            headline: String(values.headline ?? ""),
            body: String(values.review ?? ""),
          });
        }
      }

      setResult(res.reference ?? "—");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setStep(0);
    setTypeId(null);
    setValues({});
    setTouched(false);
    setError(null);
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <Check className="h-7 w-7" strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-xl font-semibold text-foreground">
          Message sent
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-foreground/50">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We&apos;ve received
          your {selectedType?.label.toLowerCase()} and will reply to {email}{" "}
          shortly.
        </p>
        <p className="mt-4 inline-block rounded-full border border-foreground/10 bg-foreground/[0.03] px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/60">
          Ref&nbsp;{result}
        </p>
        <div>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6 md:p-8">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                i <= step ? "bg-accent-teal" : "bg-foreground/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] uppercase tracking-[0.15em] transition-colors",
                i === step ? "text-accent-teal" : "text-foreground/60",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Honeypot — a decoy field only bots fill. It MUST be un-autofillable:
          when a signed-out user types their name/email, the browser's autofill
          and password managers will also populate any hidden text input that is
          merely positioned off-screen, which silently flagged genuine enquiries
          as spam. `display:none` (Tailwind `hidden`) is the reliable fix — Chrome
          autofill and 1Password/LastPass skip display:none fields — combined with
          a neutral name and the ignore hints below. */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="contact-hp-field">Leave this field empty</label>
        <input
          id="contact-hp-field"
          name="hp_field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          {/* Step 0 — choose a topic */}
          {step === 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-lg font-semibold text-foreground">
                What can we help with?
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {enquiryTypes.map((type) => {
                  const Icon = iconMap[type.icon];
                  const selected = type.id === typeId;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => {
                        setTypeId(type.id);
                        setValues({});
                      }}
                      className={cn(
                        "group/topic flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-accent-teal/40 bg-accent-teal/[0.08]"
                          : "border-foreground/10 bg-foreground/[0.02] hover:border-accent-teal/30 hover:bg-accent-teal/[0.06]",
                      )}
                      aria-pressed={selected}
                    >
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selected
                            ? "bg-accent-teal/15 text-accent-teal"
                            : "bg-foreground/5 text-foreground/70 group-hover/topic:bg-accent-teal/15 group-hover/topic:text-accent-teal",
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="flex flex-col">
                        <span
                          className={cn(
                            "text-sm font-medium transition-colors",
                            selected
                              ? "text-accent-teal"
                              : "text-foreground group-hover/topic:text-accent-teal",
                          )}
                        >
                          {type.label}
                        </span>
                        <span className="mt-0.5 text-xs leading-relaxed text-foreground/60">
                          {type.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {touched && !typeId && (
                <p className="text-xs text-red-400">
                  Please choose a topic to continue.
                </p>
              )}

              {/* Auth gate — shown when a signed-out visitor picks an
                  account-only topic (product support, reviews). */}
              {showGate && selectedType?.gate && (
                <div className="mt-1 flex flex-col gap-4 rounded-xl border border-foreground/15 bg-foreground/[0.04] p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground/70">
                      <Lock className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-semibold text-foreground">
                        {selectedType.gate.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-foreground/55">
                        {selectedType.gate.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={signInHref}
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
                    >
                      Sign in
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                    </Link>
                    {selectedType.gate.href && (
                      <Link
                        href={selectedType.gate.href}
                        className="inline-flex items-center rounded-full border border-foreground/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        {selectedType.gate.hrefLabel ?? "Learn more"}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1 — your details */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">
                Your details
              </h3>
              {user && (
                <p className="-mt-2 text-xs text-foreground/60">
                  Prefilled from your account — edit if you&apos;d like a reply
                  elsewhere.
                </p>
              )}
              <div>
                <label htmlFor="contact-name" className={labelClass}>
                  Full name
                </label>
                <input
                  id="contact-name"
                  value={name || user?.profile.displayName || user?.name || ""}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={inputClass}
                  autoComplete="name"
                />
                {touched && name.trim().length <= 1 && (
                  <p className="mt-1.5 text-xs text-red-400">
                    Please enter your name.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email || user?.email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoComplete="email"
                />
                {touched && !isEmail(email) && (
                  <p className="mt-1.5 text-xs text-red-400">
                    Please enter a valid email.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — dynamic details */}
          {step === 2 && selectedType && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">
                {selectedType.label}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {selectedType.fields.map((field) => {
                  const value = values[field.name];
                  const missing =
                    touched &&
                    field.required &&
                    (field.type === "rating"
                      ? !(typeof value === "number" && value > 0)
                      : !(
                          typeof value === "string" && value.trim().length > 0
                        ));
                  return (
                    <div
                      key={field.name}
                      className={cn(field.full && "sm:col-span-2")}
                    >
                      <label
                        htmlFor={`field-${field.name}`}
                        className={labelClass}
                      >
                        {field.label}
                        {!field.required && (
                          <span className="ml-1 text-foreground/25">
                            (optional)
                          </span>
                        )}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          id={`field-${field.name}`}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                          className={cn(inputClass, "resize-none")}
                        />
                      ) : field.type === "select" ? (
                        <select
                          id={`field-${field.name}`}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          className={cn(inputClass, "appearance-none")}
                        >
                          <option value="" disabled className="bg-[#0a0a0a]">
                            Select…
                          </option>
                          {resolveOptions(field).map((opt) => (
                            <option
                              key={opt}
                              value={opt}
                              className="bg-[#0a0a0a]"
                            >
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "rating" ? (
                        <StarRating
                          value={(value as number) ?? 0}
                          onChange={(v) => setField(field.name, v)}
                        />
                      ) : (
                        <input
                          id={`field-${field.name}`}
                          type={field.type}
                          value={(value as string) ?? ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className={inputClass}
                        />
                      )}

                      {missing && (
                        <p className="mt-1.5 text-xs text-red-400">
                          This field is required.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — review */}
          {step === 3 && selectedType && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-semibold text-foreground">
                Review &amp; send
              </h3>
              <dl className="divide-y divide-foreground/5 rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">
                    Topic
                  </dt>
                  <dd className="text-sm text-foreground">
                    {selectedType.label}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">
                    Name
                  </dt>
                  <dd className="text-sm text-foreground">{name}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">
                    Email
                  </dt>
                  <dd className="text-sm text-foreground">{email}</dd>
                </div>
                {selectedType.fields.map((field) => {
                  const value = values[field.name];
                  if (value === undefined || value === "") return null;
                  return (
                    <div
                      key={field.name}
                      className="flex items-start justify-between gap-4 px-4 py-3"
                    >
                      <dt className="text-xs uppercase tracking-[0.15em] text-foreground/40">
                        {field.label}
                      </dt>
                      <dd className="max-w-[60%] text-right text-sm text-foreground">
                        {field.type === "rating" ? `${value}/5` : String(value)}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {error && <p className="text-sm text-red-400">{error}</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full border border-foreground/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back
          </button>
        ) : (
          <span />
        )}

        {step === 0 && locked ? (
          // Signed-out visitor on an account-only topic: the gate card above
          // carries the sign-in / docs actions, so suppress Continue here.
          status === "loading" ? (
            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-foreground/40">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              Checking your account
            </span>
          ) : (
            <span />
          )
        ) : step < steps.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90"
          >
            Continue
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Sending
              </>
            ) : (
              <>
                Send message
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
