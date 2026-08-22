"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  const ongoing = trips.filter(t => new Date(t.startDate) <= today && new Date(t.endDate) >= today);
  const upcoming = trips.filter(t => new Date(t.startDate) > today);
  const completed = trips.filter(t => new Date(t.endDate) < today);

  const renderSection = (title: string, data: any[]) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h2>
      <div className="space-y-4">
        {data.length === 0 ? (
           <div className="p-6 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
             No {title.toLowerCase()} trips.
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
              placeholder="Search bar ......" 
              className="pl-9 h-10 w-full"
            />
          </div>
          <Button variant="outline" className="h-10">Group by</Button>
          <Button variant="outline" className="h-10">Filter</Button>
          <Button variant="outline" className="h-10">Sort by...</Button>
        </div>

        {loading ? (
          <div className="space-y-4">
             <Skeleton className="w-full h-24 rounded-lg" />
             <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        ) : (
          <>
            {renderSection("Ongoing", ongoing)}
            {renderSection("Up-coming", upcoming)}
            {renderSection("Completed", completed)}
          </>
        )}
      </main>
    </div>
  );
}
