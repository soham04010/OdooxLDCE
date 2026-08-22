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
import { LogOut, Pencil } from "lucide-react";
import {
  upcomingTrips,
  previousTrips,
  formatRange,
  type Trip,
} from "@/lib/sample-data";

type Profile = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
};

const EMPTY: Profile = { name: "", email: "", phone: "", city: "", country: "" };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }
    if (stored) {
      const parsed = { ...EMPTY, ...JSON.parse(stored) } as Profile;
      setProfile(parsed);
      setDraft(parsed);
    }
  }, [router]);

  if (!profile) return null;

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    // Stored locally for now — there is no PATCH /api/users/me endpoint yet.
    localStorage.setItem("user", JSON.stringify(draft));
    setProfile(draft);
    setEditing(false);
    setSaved(true);
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" aria-label="Good Weekend Co. home">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={signOut}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-9 gap-2 px-3"
            )}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* ---------------- user details ---------------- */}
        <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
            {initials}
          </div>

          <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-6">
            {editing ? (
              <form onSubmit={save} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput
                    id="name"
                    label="Name"
                    value={draft.name}
                    onChange={(v) => setDraft({ ...draft, name: v })}
                    required
                  />
                  <FieldInput
                    id="email"
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(v) => setDraft({ ...draft, email: v })}
                    required
                  />
                  <FieldInput
                    id="phone"
                    label="Phone"
                    value={draft.phone}
                    onChange={(v) => setDraft({ ...draft, phone: v })}
                  />
                  <FieldInput
                    id="city"
                    label="City"
                    value={draft.city}
                    onChange={(v) => setDraft({ ...draft, city: v })}
                  />
                  <FieldInput
                    id="country"
                    label="Country"
                    value={draft.country}
                    onChange={(v) => setDraft({ ...draft, country: v })}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Saved on this device for now — the server has no profile
                  endpoint yet.
                </p>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className={cn(buttonVariants(), "h-10 px-5")}
                  >
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(profile);
                      setEditing(false);
                    }}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-10 px-5"
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-bold tracking-tight">
                      {profile.name}
                    </h1>
                    <p className="truncate text-sm text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setSaved(false);
                    }}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-9 shrink-0 gap-2 px-3"
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  <Detail label="Phone" value={profile.phone} />
                  <Detail label="City" value={profile.city} />
                  <Detail label="Country" value={profile.country} />
                </dl>

                {saved && (
                  <p className="text-xs text-muted-foreground">Saved.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <TripRow title="Preplanned trips" trips={upcomingTrips} />
        <TripRow title="Previous trips" trips={previousTrips.slice(0, 3)} />
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TripRow({ title, trips }: { title: string; trips: Trip[] }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-4">
        <h2 className="shrink-0 text-lg font-bold tracking-tight">{title}</h2>
        <span className="h-px flex-1 bg-border" />
      </div>

      {trips.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing here yet.{" "}
          <Link href="/trips/new" className="text-wave hover:underline">
            Plan a trip
          </Link>
          .
        </p>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={trip.coverPhotoUrl}
                  alt={trip.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="truncate font-semibold">{trip.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatRange(trip.startDate, trip.endDate)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {trip.stopCount} cities
                  </p>
                </div>
                <Link
                  href={"/trips/" + trip.id}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-auto h-10 w-full"
                  )}
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">
        {value || <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  );
}

function FieldInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
      />
    </div>
  );
}
