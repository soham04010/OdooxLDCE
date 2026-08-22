"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { HeroSlider } from "@/components/hero-slider";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { featuredPlaces } from "@/lib/sample-data";

type User = { name: string; email: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token) router.push("/login");
    else if (stored) setUser(JSON.parse(stored));
  }, [router]);

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return featuredPlaces;
    return featuredPlaces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q)
    );
  }, [query]);

  if (!user) return null; // avoid a flash while redirecting

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ---------------- header: logo | search | about ---------------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/dashboard" aria-label="Good Weekend Co. home" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search destinations"
              aria-label="Search destinations"
              className="h-10 pl-9"
            />
          </div>

          <nav className="flex shrink-0 items-center gap-4">
            <Link
              href="/about"
              className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline"
            >
              About
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                router.push("/login");
              }}
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition hover:opacity-90"
            >
              {initials}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        {/* ---------------- image slides ---------------- */}
        <HeroSlider firstName={user.name.split(" ")[0]} />

        {/* ---------------- three places ---------------- */}
        <section className="mt-10">
          {places.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nothing matches that search. Try a state, like Ladakh.
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {places.map((place) => (
                <article
                  key={place.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={place.imageUrl}
                      alt={place.name + ", " + place.region}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">
                        {place.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {place.region}
                      </p>
                    </div>

                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {place.description}
                    </p>

                    <Link
                      href="/trips/new"
                      className={cn(buttonVariants(), "mt-1 h-11 w-full text-base")}
                    >
                      Plan this trip
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="border-t border-border bg-muted">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/cities" className="w-fit text-wave hover:underline">
                Destinations
              </Link>
              <Link href="/about" className="w-fit text-wave hover:underline">
                Our story
              </Link>
              <Link href="/contact" className="w-fit text-wave hover:underline">
                Contact
              </Link>
            </nav>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Good Weekend Co. builds multi-city itineraries you can actually
              afford — pick the cities, set the days, and watch the budget as it
              adds up.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-bold tracking-tight">Get in touch</h3>
            <address className="mt-3 flex flex-col gap-1 text-sm not-italic text-muted-foreground">
              <a
                href="mailto:OdooEvent5011@gmail.com"
                className="w-fit text-wave hover:underline"
              >
                OdooEvent5011@gmail.com
              </a>
              <a
                href="tel:+143940232299"
                className="w-fit text-wave hover:underline"
              >
                +1 43940232299
              </a>
            </address>
          </div>
        </div>

        {/* ---------------- legal bar ---------------- */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              © {new Date().getFullYear()} Good Weekend Co.
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/privacy" className="text-wave hover:underline">
                Privacy policy
              </Link>
              <Link href="/terms" className="text-wave hover:underline">
                Terms &amp; conditions
              </Link>
              <Link href="/accessibility" className="text-wave hover:underline">
                Accessibility statement
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
