"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

/** How long the intro runs before we move on, in ms. Matches the CSS timeline
 *  in globals.css: 0.45s fade-in, 1s spin, then the loading line at 1.5s. */
const INTRO_MS = 2600;
const REDUCED_MS = 400;

type StoredUser = {
  name: string;
  email: string;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const legacyToken = localStorage.getItem("token");
    let parsedUser: StoredUser | null = null;

    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser) as StoredUser;
      } catch {
        localStorage.removeItem("user");
      }
    }

    const destination = parsedUser
      ? "/dashboard"
      : legacyToken
        ? "/dashboard"
        : "/login";
    router.prefetch(destination);

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(
      () => {
        if (parsedUser) {
          setUser(parsedUser);
          setShowSplash(false);
          return;
        }

        router.replace(destination);
      },
      reduced ? REDUCED_MS : INTRO_MS,
    );

    return () => window.clearTimeout(timer);
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Local cleanup still signs the user out of the frontend if the API is down.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  if (showSplash) {
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

  if (!user) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-24">
      <h1 className="mb-8 text-4xl font-bold">
        Welcome to the Hackathon, {user.name}!
      </h1>
      <p className="mb-8 text-lg text-gray-600">
        You are successfully logged in with {user.email}.
      </p>
      <Button onClick={handleLogout}>Logout</Button>
    </main>
  );
}
