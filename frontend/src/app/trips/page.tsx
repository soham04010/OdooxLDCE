"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [groupBy, setGroupBy] = useState("status");

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/trips", {credentials: 'include'});
        if (res.ok) {
          const json = await res.json();
          setTrips(json || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [router]);

  // Derive ongoing, upcoming, completed (simple date logic)
  const today = new Date();

  const searched = trips.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (t.name || "").toLowerCase().includes(q) ||
      (t.description || "").toLowerCase().includes(q)
    );
  });

  const sorted = [...searched].sort((a, b) => {
    if (sortBy === "newest") return String(b.startDate).localeCompare(String(a.startDate));
    if (sortBy === "oldest") return String(a.startDate).localeCompare(String(b.startDate));
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  const ongoing = sorted.filter(t => new Date(t.startDate) <= today && new Date(t.endDate) >= today);
  const upcoming = sorted.filter(t => new Date(t.startDate) > today);
  const completed = sorted.filter(t => new Date(t.endDate) < today);

  const byYear = sorted.reduce((acc: Record<string, any[]>, t) => {
    const y = new Date(t.startDate).getFullYear().toString();
    (acc[y] ||= []).push(t);
    return acc;
  }, {});

  const showSection = (key: string) => status === "all" || status === key;

  const renderSection = (title: string, data: any[]) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h2>
      <div className="space-y-4">
        {data.length === 0 ? (
           <div className="p-6 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
             No {title.toLowerCase()} trips yet.{" "}
             <Link
               href="/trips/new"
               className="font-medium text-wave underline-offset-4 hover:underline"
             >
               Plan a {title.toLowerCase()} trip
             </Link>
             .
           </div>
        ) : (
          data.map(trip => (
            <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow border-border/80" onClick={() => router.push(`/trips/${trip.id}`)}>
              <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                   <h3 className="font-bold text-lg">{trip.name}</h3>
                   <p className="text-sm text-muted-foreground">{trip.description || "Short overview of the trip"}</p>
                 </div>
                 <div className="text-sm text-muted-foreground font-medium bg-muted/30 px-3 py-1 rounded-md">
                   {new Date(trip.startDate).toLocaleDateString()} to {new Date(trip.endDate).toLocaleDateString()}
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">User Trip Listing</h1>
        
        <div className="flex gap-2 bg-muted/20 p-2 rounded-md border border-border/50 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your trips"
              aria-label="Search your trips"
              className="pl-9 h-10 w-full"
            />
          </div>
          <SelectPill
            label="Group by"
            value={groupBy}
            onChange={setGroupBy}
            options={[
              { value: "status", label: "Status" },
              { value: "year", label: "Year" },
            ]}
          />
          <SelectPill
            label="Filter"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All trips" },
              { value: "ongoing", label: "Ongoing" },
              { value: "upcoming", label: "Up-coming" },
              { value: "completed", label: "Completed" },
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

        {loading ? (
          <div className="space-y-4">
             <Skeleton className="w-full h-24 rounded-lg" />
             <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        ) : (
          <>
            {groupBy === "year" ? (
              Object.keys(byYear).length === 0 ? (
                renderSection("Up-coming", [])
              ) : (
                Object.keys(byYear)
                  .sort((a, b) => Number(b) - Number(a))
                  .map((year) => (
                    <div key={year}>{renderSection(year, byYear[year])}</div>
                  ))
              )
            ) : (
              <>
                {showSection("ongoing") && renderSection("Ongoing", ongoing)}
                {showSection("upcoming") && renderSection("Up-coming", upcoming)}
                {showSection("completed") && renderSection("Completed", completed)}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/** Native select styled as a pill — same control the dashboard toolbar uses. */
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
    <label className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-border bg-card pl-3 pr-8 text-sm">
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
