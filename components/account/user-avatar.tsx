"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Derives up-to-two uppercase initials from a name, e.g. "Alex Rivera" -> "AR". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  name: string;
  src?: string;
  /** Pixel size of the (square) avatar. */
  size?: number;
  className?: string;
}

/**
 * Renders a user's avatar image, falling back to their initials when no image
 * is set or the image fails to load. Uses a plain <img> so it accepts both
 * uploaded data URLs and arbitrary hosted URLs (e.g. Strapi) without any
 * next/image remote-pattern configuration. Presentation-only.
 */
export function UserAvatar({
  name,
  src,
  size = 40,
  className,
}: UserAvatarProps) {
  const initials = getInitials(name);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && failedSrc !== src);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-foreground/15 bg-foreground/[0.06] font-semibold uppercase text-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {showImage ? (
        <Image
          src={src || "/placeholder.svg"}
          alt=""
          fill
          unoptimized
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <span className="tracking-tight" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}
