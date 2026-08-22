"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Decorative artwork for the auth pages.
 *
 * A traveller with a camera, drawn flat in the brand palette, over an
 * abstract blob cluster. HIGH SEA appears here as a small accent — this is
 * the "brand moment" the reserve colours are kept for, not a semantic role.
 *
 * To use a photograph instead, put a cut-out PNG (transparent background)
 * in `public/` and pass `photoSrc="/traveller.png"`. The blobs stay behind
 * it and the drawn figure is hidden.
 */
export function AuthArt({
  className,
  photoSrc,
}: {
  className?: string;
  photoSrc?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  const shirtId = `${clipId}s`;

  // If the photo file isn't there, fall back to the drawn figure rather than
  // showing a broken image. Drop the file in and it takes over on next load.
  const [photoFailed, setPhotoFailed] = useState(false);
  const usePhoto = Boolean(photoSrc) && !photoFailed;

  return (
    <div
      className={cn(
        "relative w-full max-w-md",
        usePhoto ? "aspect-[473/530]" : "aspect-square",
        className,
      )}
    >
      {/* When a photo is provided and loads successfully, show ONLY the photo
          (it already contains the blob artwork). Otherwise show the SVG. */}
      {!usePhoto && (
        <svg
          viewBox="0 0 400 400"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A traveller taking a photograph"
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx="200" cy="200" r="168" />
            </clipPath>
            <clipPath id={shirtId}>
              <path d="M138 400 C138 334 166 306 200 306 C234 306 262 334 262 400 Z" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <circle cx="200" cy="200" r="168" fill="var(--cream)" />

            {/* ---------- blobs ---------- */}
            <path
              d="M32 200 C32 108 100 34 196 32 C206 96 168 150 108 176 C74 190 50 196 32 200 Z"
              fill="var(--wave)"
              opacity="0.9"
            />
            <path
              d="M214 32 C300 40 368 110 368 196 C300 200 250 168 226 112 C214 84 210 56 214 32 Z"
              fill="var(--sand)"
            />
            <path
              d="M368 214 C362 302 294 366 206 368 C198 300 232 244 292 220 C322 208 348 210 368 214 Z"
              fill="var(--marine)"
            />
            <path
              d="M32 218 C60 288 96 330 158 356 C170 316 150 268 108 242 C84 228 56 220 32 218 Z"
              fill="var(--high-sea)"
              opacity="0.92"
            />

            {/* ---------- drawn figure ---------- */}
            <g>
              {/* ---------- hair, behind ---------- */}
              <path
                d="M154 240 C154 300 146 336 140 372 L176 372 C168 330 172 286 176 250 Z"
                fill="#101f3d"
              />
              <path
                d="M246 240 C246 300 254 336 260 372 L224 372 C232 330 228 286 224 250 Z"
                fill="#101f3d"
              />

              {/* ---------- torso ---------- */}
              <path
                d="M138 400 C138 334 166 306 200 306 C234 306 262 334 262 400 Z"
                fill="#fbfaf6"
              />
              <g clipPath={`url(#${shirtId})`}>
                <rect x="120" y="318" width="160" height="9" fill="var(--wave)" opacity=".85" />
                <rect x="120" y="338" width="160" height="9" fill="var(--high-sea)" opacity=".7" />
                <rect x="120" y="358" width="160" height="9" fill="var(--wave)" opacity=".85" />
                <rect x="120" y="378" width="160" height="9" fill="var(--high-sea)" opacity=".7" />
              </g>

              {/* backpack strap */}
              <path
                d="M232 312 C240 340 244 366 246 400"
                stroke="var(--high-sea)"
                strokeWidth="11"
                fill="none"
                strokeLinecap="round"
              />

              {/* ---------- neck + head ---------- */}
              <rect x="186" y="278" width="28" height="34" rx="12" fill="#e0b285" />
              <circle cx="200" cy="248" r="41" fill="var(--sand)" />

              {/* fringe under the hat */}
              <path
                d="M161 240 C164 214 180 202 200 202 C220 202 236 214 239 240 C226 226 212 220 200 220 C188 220 174 226 161 240 Z"
                fill="#101f3d"
              />

              {/* ---------- arms ---------- */}
              <path
                d="M158 336 C142 306 144 276 162 258"
                stroke="var(--sand)"
                strokeWidth="23"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M242 336 C258 306 256 276 238 258"
                stroke="var(--sand)"
                strokeWidth="23"
                fill="none"
                strokeLinecap="round"
              />

              {/* ---------- camera ---------- */}
              <rect x="182" y="212" width="26" height="13" rx="4" fill="#0b1730" />
              <rect x="158" y="222" width="84" height="58" rx="10" fill="var(--marine)" />
              <rect x="166" y="230" width="20" height="9" rx="4" fill="#3c5687" />
              <circle cx="200" cy="252" r="22" fill="#0b1730" />
              <circle cx="200" cy="252" r="16" fill="var(--wave)" />
              <circle cx="200" cy="252" r="8" fill="#0b1730" />
              <circle cx="194" cy="246" r="4" fill="#fbfaf6" opacity=".85" />

              {/* ---------- hands over the camera ---------- */}
              <rect x="148" y="234" width="22" height="34" rx="11" fill="#e6bf95" />
              <rect x="230" y="234" width="22" height="34" rx="11" fill="var(--sand)" />

              {/* ---------- hat ---------- */}
              <ellipse cx="200" cy="215" rx="75" ry="17" fill="#e4c398" />
              <path
                d="M152 216 C152 178 172 158 200 158 C228 158 248 178 248 216 Z"
                fill="#eed3ab"
              />
              <path
                d="M153 210 C170 218 230 218 247 210 L248 216 C230 224 170 224 152 216 Z"
                fill="var(--marine)"
              />
            </g>
          </g>
        </svg>
      )}

      {usePhoto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoSrc}
          alt="A traveller taking a photograph"
          onError={() => setPhotoFailed(true)}
          className="absolute inset-0 h-full w-full object-contain"
        />
      )}
    </div>
  );
}
