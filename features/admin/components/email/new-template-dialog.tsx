"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STARTER_GROUPS, STARTERS } from "@/features/email";
import type { BlockType } from "@/features/email";

const BLOCK_LABEL: Partial<Record<BlockType, string>> = {
  hero: "Hero",
  heading: "Heading",
  text: "Text",
  button: "Button",
  image: "Image",
  list: "List",
  callout: "Callout",
  productPicks: "Products",
  divider: "Divider",
  spacer: "Spacer",
};

export type ExistingOption = { id: number; name: string; isSystem: boolean };

export function NewTemplateDialog({
  open,
  onOpenChange,
  existing,
  pendingKey,
  onPickStarter,
  onPickExisting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: ExistingOption[];
  pendingKey: string | null;
  onPickStarter: (starterId: string) => void;
  onPickExisting: (templateId: number) => void;
}) {
  const [sourceId, setSourceId] = useState<string>("");
  const busy = pendingKey !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New template</DialogTitle>
          <DialogDescription>
            Pick a starter layout or copy an existing template. You can change
            everything after.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto pr-1">
          {STARTER_GROUPS.map((group) => (
            <section
              key={group.id}
              className="flex flex-col gap-2"
              aria-labelledby={`starter-group-${group.id}`}
            >
              <h3
                id={`starter-group-${group.id}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {group.label}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STARTERS.filter((s) => s.group === group.id).map((s) => {
                  const key = `starter-${s.id}`;
                  const heroImage = s.blocks.find(
                    (b) => b.type === "hero" && b.imageUrl,
                  ) as { imageUrl: string } | undefined;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onPickStarter(s.id)}
                        disabled={busy}
                        className="flex h-full w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-accent-teal/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                      >
                        <div
                          className="flex flex-col gap-1 rounded-lg bg-muted/50 p-2"
                          aria-hidden
                        >
                          {s.blocks.slice(0, 5).map((b, i) =>
                            b.type === "hero" && heroImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={heroImage.imageUrl}
                                alt=""
                                loading="lazy"
                                className="aspect-[2/1] w-full rounded object-cover"
                              />
                            ) : (
                              <span
                                key={i}
                                className={
                                  b.type === "hero"
                                    ? "h-6 rounded bg-accent-teal/25"
                                    : b.type === "button"
                                      ? "h-2.5 w-1/3 rounded-full bg-accent-teal/60"
                                      : b.type === "productPicks"
                                        ? "h-4 rounded bg-foreground/15"
                                        : "h-1.5 rounded bg-foreground/15"
                                }
                              />
                            ),
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold tracking-tight">
                            {s.name}
                          </span>
                          {pendingKey === key && (
                            <Loader2
                              className="size-4 animate-spin"
                              aria-label="Creating"
                            />
                          )}
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {s.blurb}
                        </p>
                        <p className="mt-auto text-xs text-muted-foreground">
                          {s.blocks
                            .map((b) => BLOCK_LABEL[b.type] ?? b.type)
                            .join(" · ")}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <label htmlFor="copy-source" className="text-sm font-medium">
            Or start from an existing template
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={sourceId}
              onValueChange={setSourceId}
              disabled={busy || existing.length === 0}
            >
              <SelectTrigger id="copy-source" className="sm:flex-1">
                <SelectValue placeholder="Choose a template to copy" />
              </SelectTrigger>
              <SelectContent>
                {existing.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                    {t.isSystem ? " (system)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              disabled={busy || !sourceId}
              onClick={() => onPickExisting(Number(sourceId))}
              className="gap-2"
            >
              {pendingKey === `copy-${sourceId}` && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Copy template
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
