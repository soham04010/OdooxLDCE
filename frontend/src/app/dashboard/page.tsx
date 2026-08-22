"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Calendar, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<{ recentTrips: any[], popularCities: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));

    const fetchDashboard = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard", {credentials: 'include'});
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error(e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Banner Section */}
        <div className="relative w-full h-[320px] rounded-2xl overflow-hidden mb-12 shadow-sm border">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000" 
            alt="Travel Banner" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-md">Where to next, {user.name.split(' ')[0]}?</h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-2xl drop-shadow-sm font-medium">Plan your perfect itinerary, discover hidden gems, and track your budget all in one place.</p>
            <Button size="lg" className="rounded-full px-8 shadow-lg" onClick={() => router.push("/trips/new")}>
              <Plus className="mr-2 h-5 w-5" /> Start a New Trip
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg flex items-center border border-red-100">
            <AlertCircle className="w-5 h-5 mr-2" />
            Cannot connect to backend server. Please ensure the backend API is running on port 5000.
          </div>
        )}

        {/* Popular Cities */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Trending Destinations</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)
            ) : data?.popularCities?.map((city) => (
              <Card key={city.id} className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all rounded-xl border-0 shadow-sm">
                <div className="h-40 bg-muted relative">
                  <img 
                    src={city.imageUrl || `https://images.unsplash.com/photo-1502602898657-3e91760cbb34`} 
                    alt={city.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-bold text-lg leading-tight">{city.name}</h3>
                    <p className="text-sm text-gray-300 font-medium">{city.country}</p>
                  </div>
                </div>
              </Card>
            ))}
            {!loading && (!data?.popularCities || data.popularCities.length === 0) && !error && (
               <div className="col-span-full py-8 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
                 No trending destinations available at the moment.
               </div>
            )}
          </div>
        </div>

        {/* Recent Trips */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Your Trips</h2>
            <Button variant="ghost" className="text-primary hover:bg-primary/5" onClick={() => router.push("/trips")}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)
            ) : (!data?.recentTrips || data.recentTrips.length === 0) && !error ? (
              <Card className="flex flex-col items-center justify-center p-10 text-center bg-white shadow-sm h-52 col-span-full border-dashed rounded-xl">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-1">No trips planned yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">Your upcoming adventures will appear here. Start mapping out your dream vacation today!</p>
                <Button onClick={() => router.push("/trips/new")} className="rounded-full">
                  Create Trip
                </Button>
              </Card>
            ) : (
              data?.recentTrips?.map((trip: any) => (
                <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-all flex flex-col rounded-xl border-0 shadow-sm bg-white">
                  <div className="h-28 relative bg-muted">
                    {trip.coverPhotoUrl ? (
                       <img src={trip.coverPhotoUrl} alt="Trip" className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 truncate text-foreground">{trip.name}</h3>
                    <div className="flex items-center text-sm font-medium text-muted-foreground mb-5 bg-gray-50 p-2 rounded-md w-max">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </div>
                    <Button variant="outline" className="w-full mt-auto rounded-lg border-gray-200 hover:border-primary hover:text-primary transition-colors" onClick={() => router.push(`/trips/${trip.id}`)}>
                      View Itinerary
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
