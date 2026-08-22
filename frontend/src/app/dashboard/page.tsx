"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";

import { HeroSlider } from "@/components/hero-slider";
import { Navbar } from "@/components/layout/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { costLabel, formatRange } from "@/lib/sample-data";
import { cn } from "@/lib/utils";

type User = {
  id?: string;
  name: string;
  email: string;
};

type DashboardCity = {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  costIndex?: number | null;
  imageUrl?: string | null;
};

type DashboardTrip = {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  coverPhotoUrl?: string | null;
  stopCount?: number;
};

type DashboardData = {
  recentTrips: DashboardTrip[];
  popularCities: DashboardCity[];
};

const DASHBOARD_ERROR =
  "Cannot connect to backend server. Please ensure the backend API is running on port 5000.";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [groupBy, setGroupBy] = useState("none");
  const [region, setRegion] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      let storedUser: User | null = null;
      const stored = localStorage.getItem("user");

      if (stored) {
        try {
          storedUser = JSON.parse(stored) as User;
          if (!cancelled) setUser(storedUser);
        } catch {
          localStorage.removeItem("user");
        }
      }

      try {
        const dashboardRequest = fetch(
          "http://localhost:5000/api/dashboard",
          { credentials: "include" }
        );
        const userRequest = storedUser
          ? Promise.resolve<Response | null>(null)
          : fetch("http://localhost:5000/api/auth/me", {
              credentials: "include",
            });

        const [dashboardResponse, userResponse] = await Promise.all([
          dashboardRequest,
          userRequest,
        ]);

        if (
          dashboardResponse.status === 401 ||
          userResponse?.status === 401
        ) {
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!dashboardResponse.ok) throw new Error(DASHBOARD_ERROR);

        const dashboardData = (await dashboardResponse.json()) as DashboardData;
        if (!cancelled) setData(dashboardData);

        if (userResponse?.ok) {
          const responseData = (await userResponse.json()) as { user: User };
          localStorage.setItem("user", JSON.stringify(responseData.user));
          if (!cancelled) setUser(responseData.user);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          (data?.popularCities ?? [])
            .map((city) => city.region)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [data]
  );

  const cities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (data?.popularCities ?? []).filter((city) => {
      const cityRegion = city.region ?? "";
      const matchesRegion = region === "all" || cityRegion === region;
      const matchesQuery =
        normalizedQuery === "" ||
        city.name.toLowerCase().includes(normalizedQuery) ||
        cityRegion.toLowerCase().includes(normalizedQuery) ||
        city.country.toLowerCase().includes(normalizedQuery);

      return matchesRegion && matchesQuery;
    });
  }, [data, query, region]);

  const trips = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = (data?.recentTrips ?? []).filter(
      (trip) =>
        normalizedQuery === "" ||
        trip.name.toLowerCase().includes(normalizedQuery) ||
        (trip.description ?? "").toLowerCase().includes(normalizedQuery)
    );
    const sorted = [...filtered];

    if (sortBy === "newest") {
      sorted.sort((a, b) => b.startDate.localeCompare(a.startDate));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [data, query, sortBy]);

  const tripGroups = useMemo(() => {
    if (groupBy !== "year") return [{ label: "", items: trips }];

    const byYear = new Map<string, DashboardTrip[]>();
    for (const trip of trips) {
      const year = new Date(trip.startDate).getFullYear().toString();
      byYear.set(year, [...(byYear.get(year) ?? []), trip]);
    }

    return [...byYear.entries()]
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([label, items]) => ({ label, items }));
  }, [groupBy, trips]);

  const firstName = user?.name?.split(" ")[0] || "traveller";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-16">
        <HeroSlider firstName={firstName} />

        <div className="mt-4 flex justify-end">
          <Link
            href="/trips/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-11 rounded-full px-6 shadow-sm"
            )}
          >
            <Plus className="h-5 w-5" />
            Start a New Trip
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center rounded-lg border border-red-100 bg-red-50 p-4 text-red-600"
          >
            <AlertCircle className="mr-2 h-5 w-5 shrink-0" />
            {DASHBOARD_ERROR}
          </div>
        )}

        <section className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
                ...regions.map((item) => ({ value: item, label: item })),
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

        <section className="mt-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-wave">
            Trending Destinations
          </p>
          <SectionHeading>Top regional selections</SectionHeading>

          {loading ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : cities.length === 0 ? (
            <Empty>
              {error
                ? "Destinations are unavailable while the server is offline."
                : "No cities match that search."}
            </Empty>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {cities.map((city) => {
                const location = [city.region, city.country]
                  .filter(Boolean)
                  .join(", ");
                const price =
                  typeof city.costIndex === "number"
                    ? costLabel(city.costIndex)
                    : null;

                return (
                  <Link
                    key={city.id}
                    href="/cities"
                    className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      <img
                        src={
                          city.imageUrl ||
                          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800"
                        }
                        alt={`${city.name}, ${city.country}`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">
                        {city.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {location}
                        {price ? ` · ${price}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-12">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-wave">
            Your Trips
          </p>
          <div className="flex items-center gap-4">
            <h2 className="shrink-0 text-lg font-bold tracking-tight">
              Previous trips
            </h2>
            <span className="h-px flex-1 bg-border" />
            <Link
              href="/trips"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 text-primary"
              )}
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {error
                  ? "Your trips are unavailable while the server is offline."
                  : query
                    ? "No trips match that search."
                    : "No trips planned yet. Your upcoming adventures will appear here."}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link
                  href="/trips/new"
                  className="text-sm font-medium text-wave hover:underline"
                >
                  Plan a new one
                </Link>
                <Link
                  href="/trips/new"
                  className={cn(buttonVariants(), "h-9 rounded-full px-4")}
                >
                  Create Trip
                </Link>
              </div>
            </div>
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
                    <article
                      key={trip.id}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md"
                    >
                      <Link href={`/trips/${trip.id}`} className="block">
                        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                          {trip.coverPhotoUrl ? (
                            <img
                              src={trip.coverPhotoUrl}
                              alt={trip.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-marine via-wave to-sand" />
                          )}
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <Link href={`/trips/${trip.id}`}>
                          <p className="truncate font-semibold">{trip.name}</p>
                        </Link>
                        <p className="mt-1 flex items-center text-sm text-muted-foreground">
                          <Calendar className="mr-2 h-4 w-4 text-primary" />
                          {formatRange(trip.startDate, trip.endDate)}
                        </p>
                        {typeof trip.stopCount === "number" && (
                          <p className="text-sm text-muted-foreground">
                            {trip.stopCount} cities
                          </p>
                        )}
                        {trip.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {trip.description}
                          </p>
                        )}
                        <Link
                          href={`/trips/${trip.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "mt-4 h-10 w-full"
                          )}
                        >
                          View Itinerary
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

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
              <Link
                href="/accessibility"
                className="text-wave hover:underline"
              >
                Accessibility statement
              </Link>
            </nav>
          </div>
        </div>
      </footer>

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

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="relative inline-flex h-11 items-center gap-2 rounded-md border border-border bg-card pl-3 pr-8 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none bg-transparent font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
    </label>
  );
}
