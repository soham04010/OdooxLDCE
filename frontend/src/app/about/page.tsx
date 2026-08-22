import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  Map,
  BedDouble,
  Car,
  MapPin,
  Users,
  CalendarDays,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Good Weekend Co. is a trip-management platform for planning, organising and experiencing trips — from the first idea to the journey home.",
};

const WHAT_WE_DO = [
  {
    icon: Map,
    title: "Trip planning",
    body: "Build and organise complete itineraries.",
  },
  {
    icon: BedDouble,
    title: "Stay management",
    body: "Manage hotels and accommodation details.",
  },
  {
    icon: Car,
    title: "Transport",
    body: "Coordinate transportation and travel schedules.",
  },
  {
    icon: MapPin,
    title: "Destination management",
    body: "Keep places, activities and routes organised.",
  },
  {
    icon: Users,
    title: "Group trips",
    body: "Coordinate plans for multiple travellers.",
  },
  {
    icon: CalendarDays,
    title: "Schedule management",
    body: "Keep every activity and booking on track.",
  },
];

const WHY = [
  "Everything organised around the trip",
  "Clear schedules and itineraries",
  "Easy group coordination",
  "Centralised travel information",
  "Designed for short and long journeys",
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/dashboard" aria-label="Good Weekend Co. home">
            <Logo size="sm" />
          </Link>
          <Link
            href="/trips/new"
            className={cn(buttonVariants(), "h-10 px-5")}
          >
            Plan a trip
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------- 1 · hero ---------------- */}
        <section className="relative overflow-hidden">
          <div className="relative h-[340px] w-full sm:h-[420px]">
            <Image
              src="/cities/sonamarg.jpg"
              alt="A traveller looking out over the Sonamarg valley in Kashmir"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-marine/90 via-marine/60 to-marine/20" />
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-5xl px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                About Good Weekend Co.
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                We make every weekend worth remembering.
              </h1>
              <p className="mt-4 max-w-xl text-white/85">
                A modern trip-management platform built to make planning,
                organising and experiencing trips simpler — from the first idea
                to the journey home.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-6">
          {/* ---------------- 2 · who we are ---------------- */}
          <Section title="Who we are">
            <p>
              Good Weekend Co. brings trip planning, coordination and travel
              information into one place. Whether it is a weekend escape, a group
              adventure, a road trip or a carefully planned getaway, we help
              travellers organise the details without the usual complexity.
            </p>
          </Section>

          {/* ---------------- 3 · what we do ---------------- */}
          <Section title="What we do">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WHAT_WE_DO.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <Icon className="h-5 w-5 text-wave" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* ---------------- 4 · philosophy ---------------- */}
          <section className="my-14 rounded-2xl bg-marine px-8 py-12 text-center sm:px-12">
            <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Plan less. Experience more.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              Travel should not feel like managing spreadsheets, messages,
              bookings and endless tabs. Good Weekend Co. is built around one
              simple idea: the planning should be organised so the experience can
              be spontaneous.
            </p>
          </section>

          {/* ---------------- 5 · why ---------------- */}
          <Section title="Why Good Weekend Co.">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              One trip. One place.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {WHY.map((item) => (
                <li key={item} className="flex gap-3 text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          {/* ---------------- 6 · mission ---------------- */}
          <Section title="Our mission">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              To make travel planning as enjoyable as the journey itself.
            </p>
            <p className="mt-3">
              We are building a simpler way for people to discover destinations,
              organise trips, coordinate with others, and spend more time
              enjoying where they are going.
            </p>
          </Section>

          {/* ---------------- 7 · trust ---------------- */}
          <section className="my-14 border-y border-border py-10 text-center">
            <p className="text-xl font-bold tracking-tight">
              Built for modern travellers
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We are new, so we would rather show you the product than quote
              numbers we have not earned yet.
            </p>
          </section>

          {/* ---------------- 8 · cta ---------------- */}
          <section className="pb-20 text-center">
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your next weekend starts here.
            </p>
            <Link
              href="/trips/new"
              className={cn(buttonVariants(), "btn-glow mt-6 h-12 px-8 text-base")}
            >
              Plan a trip
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="my-14">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
