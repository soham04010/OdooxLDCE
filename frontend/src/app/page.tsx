"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";

/** How long the intro runs before we move on, in ms. Matches the CSS timeline
 *  in globals.css: 0.45s fade-in, 1s spin, then the loading line at 1.5s. */
const INTRO_MS = 2600;
const REDUCED_MS = 400;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // Someone already signed in shouldn't be sent back to the login form.
    const destination = localStorage.getItem("token") ? "/dashboard" : "/login";
    router.prefetch(destination);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => router.replace(destination),
      reduced ? REDUCED_MS : INTRO_MS
    );

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <div className="splash-enter flex flex-col items-center gap-4">
        <LogoMark className="splash-mark" size="xl" />
        <p className="text-3xl font-bold tracking-tight">
          Good Weekend <span className="text-wave">Co.</span>
        </p>
      </div>

      <p
        className="splash-load flex items-center gap-1 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        loading
        <span className="splash-dots inline-flex gap-0.5" aria-hidden="true">
          <span className="splash-dot">.</span>
          <span className="splash-dot">.</span>
          <span className="splash-dot">.</span>
        </span>
      </p>
    </main>
  );
}
