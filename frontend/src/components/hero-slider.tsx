"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { heroSlides } from "@/lib/sample-data";

const INTERVAL_MS = 5000;

export function HeroSlider({ firstName }: { firstName: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animate, setAnimate] = useState(true);
  const count = heroSlides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  // Auto-advance, unless the viewer is interacting or prefers less motion.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnimate(!reduced);
    if (reduced || paused) return;

    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  // Keep the live region quiet on first paint, announce only real changes.
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);

  const current = heroSlides[index];

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-2xl"
      aria-roledescription="carousel"
      aria-label="Featured destinations"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* ---------- the sliding track ---------- */}
      <div className="relative h-[260px] w-full overflow-hidden sm:h-[380px]">
        <div
          className={cn(
            "flex h-full w-full",
            animate && "transition-transform duration-700 ease-out"
          )}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {heroSlides.map((slide, i) => (
            <div
              key={slide.id}
              className="relative h-full w-full shrink-0 grow-0 basis-full"
              aria-hidden={i !== index}
            >
              <Image
                src={slide.imageUrl}
                alt={`${slide.place}, ${slide.region}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1152px) 100vw, 1152px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* one overlay across the whole frame, so it doesn't slide with the images */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-marine/90 via-marine/55 to-marine/10" />
      </div>

      {/* ---------- fixed copy ---------- */}
      <div className="absolute inset-0 flex flex-col justify-center gap-3 p-8 sm:p-12">
        <p className="max-w-md text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          Where are you going next, {firstName}?
        </p>
        <p className="max-w-sm text-white/80">
          Pick your cities, set the days, and we&apos;ll keep the budget in view.
        </p>
        <div>
          <Link
            href="/trips/new"
            className={cn(
              buttonVariants(),
              "mt-2 h-11 gap-1.5 bg-accent px-5 text-base text-accent-foreground hover:bg-accent/90"
            )}
          >
            <Plus className="h-4 w-4" />
            Plan a trip
          </Link>
        </div>
      </div>

      {/* ---------- caption for the current slide ---------- */}
      <p
        className="absolute bottom-6 right-6 hidden text-right text-sm text-white/85 sm:block"
        aria-live={first.current ? "off" : "polite"}
      >
        <span className="font-semibold">{current.place}</span>
        <span className="text-white/60"> · {current.region}</span>
      </p>

      {/* ---------- controls ---------- */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous destination"
        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next destination"
        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-6 left-8 flex gap-2 sm:left-12">
        {heroSlides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show ${slide.place}`}
            aria-current={i === index}
            className={cn(
              "h-2 rounded-full transition-all",
              i === index ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </section>
  );
}
