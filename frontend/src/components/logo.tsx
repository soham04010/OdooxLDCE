"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Sizes for the brand mark and its wordmark, kept together so the two
 * always scale in step. Tune the numbers here rather than passing
 * one-off height classes at the call site.
 */
const SIZES = {
  sm: { mark: "h-10 w-10", word: "text-2xl", gap: "gap-2.5" }, //  40px
  md: { mark: "h-14 w-14", word: "text-3xl", gap: "gap-3" },   //  56px
  lg: { mark: "h-24 w-24", word: "text-4xl", gap: "gap-4" },   //  96px
  xl: { mark: "h-36 w-36", word: "text-4xl", gap: "gap-5" },   // 144px
} as const;

type LogoSize = keyof typeof SIZES;

/**
 * Good Weekend Co. brand mark — a simplified take on the logo:
 * a SAND sun disc behind a MARINE headland, with WAVE water below.
 * Colours come from the palette vars so it tracks the theme.
 */
export function LogoMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: LogoSize;
}) {
  // Two marks can share a page (header + footer), so the clip id must be unique.
  const clipId = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(SIZES[size].mark, className)}
      role="img"
      aria-label="Good Weekend Co."
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="24" cy="24" r="21" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <circle cx="24" cy="24" r="21" fill="var(--sand)" />
        {/* headland */}
        <path d="M-2 33 L13 18 L21 26 L29 14 L50 33 Z" fill="var(--marine)" />
        {/* water: white break, then two wave bands */}
        <path d="M-2 31 C8 27 15 35 24 31 C33 27 42 34 50 30 L50 50 L-2 50 Z" fill="#ffffff" />
        <path d="M-2 34 C8 30 15 38 24 34 C33 30 42 37 50 33 L50 50 L-2 50 Z" fill="var(--wave)" />
        <path d="M-2 39 C8 35 15 43 24 39 C33 35 42 42 50 38 L50 50 L-2 50 Z" fill="var(--marine)" />
      </g>
    </svg>
  );
}

/** Mark plus wordmark, as used in the auth headers. */
export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: LogoSize;
}) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "flex items-center font-bold tracking-tight",
        s.gap,
        s.word,
        className
      )}
    >
      <LogoMark size={size} />
      <span>
        Good Weekend <span className="text-wave">Co.</span>
      </span>
    </div>
  );
}
