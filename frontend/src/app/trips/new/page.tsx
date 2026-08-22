"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Loader2, Check } from "lucide-react";
import { topCities } from "@/lib/sample-data";

type User = { name: string; email: string };

export default function CreateTripPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token) router.push("/login");
    else if (stored) setUser(JSON.parse(stored));
  }, [router]);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (endDate < startDate) {
      setError("Your end date is before your start date.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate, placeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not create the trip");
      router.push("/dashboard");
    } catch {
      setError(
        "That did not save — the server has no /api/trips endpoint yet."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" aria-label="Good Weekend Co. home">
            <Logo size="sm" />
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* ---------------- plan a new trip ---------------- */}
          <h1 className="border-b border-border px-6 py-4 text-lg font-bold tracking-tight">
            Plan a new trip
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
            {error && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {error}
              </p>
            )}

            <Field label="Trip name" htmlFor="name">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ladakh on two wheels"
                required
                className="h-11"
              />
            </Field>

            <Field label="Start date" htmlFor="start">
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-11"
              />
            </Field>

            <Field label="Select a place" htmlFor="place">
              <select
                id="place"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                required
                className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Choose a city</option>
                {topCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.region}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="End date" htmlFor="end">
              <Input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-11"
              />
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving}
                className={cn(buttonVariants(), "h-11 gap-2 px-6 text-base")}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create trip
              </button>
            </div>
          </form>

          {/* ---------------- suggestions ---------------- */}
          <h2 className="border-y border-border px-6 py-4 text-sm font-semibold tracking-tight">
            Suggestions for places to visit
          </h2>

          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3">
            {topCities.map((city) => {
              const selected = placeId === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => setPlaceId(city.id)}
                  aria-pressed={selected}
                  className={cn(
                    "group overflow-hidden rounded-xl border text-left transition",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:shadow-md"
                  )}
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={city.imageUrl}
                      alt={city.name + ", " + city.region}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                    {selected && (
                      <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{city.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {city.region}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center sm:gap-4">
      <Label htmlFor={htmlFor} className="text-sm">
        {label}
      </Label>
      {children}
    </div>
  );
}
