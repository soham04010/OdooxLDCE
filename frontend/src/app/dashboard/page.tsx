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
import { Search, Plus, ChevronDown } from "lucide-react";
import {
  topCities,
  previousTrips,
  formatRange,
  costLabel,
} from "@/lib/sample-data";

type User = { name: string; email: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [region, setRegion] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token) router.push("/login");
    else if (stored) setUser(JSON.parse(stored));
  }, [router]);

  const regions = useMemo(
    () => Array.from(new Set(topCities.map((c) => c.region))).sort(),
    []
  );

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topCities.filter(
      (c) =>
        (region === "all" || c.region === region) &&
        (q === "" ||
          c.name.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q))
    );
  }, [query, region]);

  const trips = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = previousTrips.filter(
      (t) => q === "" || t.name.toLowerCase().includes(q)
    );
    const sorted = [...list];
    if (sortBy === "newest") {
      sorted.sort((a, b) => b.startDate.localeCompare(a.startDate));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [query, sortBy]);

  const tripGroups = useMemo(() => {
    if (groupBy !== "year") return [{ label: "", items: trips }];
    const byYear = new Map<string, typeof trips>();
    for (const t of trips) {
      const y = new Date(t.startDate).getFullYear().toString();
      byYear.set(y, [...(byYear.get(y) ?? []), t]);
    }
    return [...byYear.entries()]
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([label, items]) => ({ label, items }));
  }, [trips, groupBy]);

  if (!user) return null; // avoid a flash while redirecting

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" aria-label="Good Weekend Co. home">
            <Logo size="sm" />
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="hidden text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline"
            >
              About
            </Link>
            <Link
              href="/profile"
              title="Your profile"
              aria-label="Your profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground transition hover:opacity-90"
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        {/* ---------------- banner ---------------- */}
        <HeroSlider firstName={user.name.split(" ")[0]} />

        {/* ---------------- search | group | filter | sort ---------------- */}
        <section className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities or your trips"
              aria-label="Search cities or your trips"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <SelectPill
              label="Group by"
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { value: "none", label: "Nothing" },
                { value: "year", label: "Year" },
              ]}
            />
            <SelectPill
              label="Filter"
              value={region}
              onChange={setRegion}
              options={[
                { value: "all", label: "All regions" },
                ...regions.map((r) => ({ value: r, label: r })),
              ]}
            />
            <SelectPill
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
                { value: "name", label: "Name A-Z" },
              ]}
            />
          </div>
        </section>

        {/* ---------------- top regional selections ---------------- */}
        <section className="mt-10">
          <SectionHeading>Top regional selections</SectionHeading>

          {cities.length === 0 ? (
            <Empty>No cities match that search.</Empty>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {cities.map((city) => (
                <Link
                  key={city.id}
                  href="/cities"
                  className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <Image
                      src={city.imageUrl}
                      alt={city.name + ", " + city.region}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 180px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{city.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {city.region} · {costLabel(city.costIndex)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ---------------- previous trips ---------------- */}
        <section className="mt-12">
          <SectionHeading>Previous trips</SectionHeading>

          {trips.length === 0 ? (
            <Empty>
              No trips match that search.{" "}
              <Link href="/trips/new" className="text-wave hover:underline">
                Plan a new one
              </Link>
              .
            </Empty>
          ) : (
            tripGroups.map((group) => (
              <div key={group.label || "all"} className="mt-4">
                {group.label && (
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    {group.label}
                  </p>
                )}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((trip) => (
                    <Link
                      key={trip.id}
                      href={"/trips/" + trip.id}
                      className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <Image
                          src={trip.coverPhotoUrl}
                          alt={trip.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 340px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        <p className="truncate font-semibold">{trip.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatRange(trip.startDate, trip.endDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {trip.stopCount} cities
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
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

          <div>
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

        {/* legal bar — extra room on the right so the floating button clears it */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 pb-24 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between lg:pb-5 lg:pr-52">
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

      {/* ---------------- floating plan-a-trip button ---------------- */}
      <Link
        href="/trips/new"
        className={cn(
          buttonVariants(),
          "fixed bottom-6 right-6 z-30 h-14 gap-2 rounded-full px-6 text-base shadow-lg shadow-marine/25"
        )}
      >
        <Plus className="h-5 w-5" />
        Plan a trip
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-lg font-bold tracking-tight">{children}</h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** A native select styled as a pill, so no extra primitive is needed yet. */
function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card pl-3 pr-8 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent font-medium outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}
