"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function CommunityPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/community/trips")
      .then(res => res.json())
      .then(data => {
        setTrips(data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTrips = trips.filter(t => 
    t.trip.name.toLowerCase().includes(search.toLowerCase()) ||
    t.trip.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Community tab</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex gap-2 bg-muted/20 p-2 rounded-md border border-border/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search bar ......" 
                  className="pl-9 h-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" className="h-10">Group by</Button>
              <Button variant="outline" className="h-10">Filter</Button>
              <Button variant="outline" className="h-10">Sort by...</Button>
            </div>

            <div className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="w-full h-32 rounded-lg" />
                  <Skeleton className="w-full h-32 rounded-lg" />
                  <Skeleton className="w-full h-32 rounded-lg" />
                </>
              ) : filteredTrips.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground border rounded-lg border-dashed">
                  No public trips found in the community yet. Be the first to share one!
                </div>
              ) : (
                filteredTrips.map((item: any, i) => (
                  <Card key={item.trip.id} className="overflow-hidden flex items-stretch border-border/80 shadow-sm transition-hover hover:shadow-md">
                    <div className="w-48 bg-muted relative shrink-0">
                       <img 
                          src={item.trip.coverPhotoUrl || `https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80`} 
                          alt={item.trip.name}
                          className="w-full h-full object-cover"
                       />
                       <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                         By {item.user}
                       </div>
                    </div>
                    <CardContent className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{item.trip.name}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{item.trip.description || "No description provided."}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center text-xs text-muted-foreground gap-4">
                           <div className="flex items-center gap-1">
                             <Calendar className="h-3 w-3" />
                             {new Date(item.trip.startDate).toLocaleDateString()}
                           </div>
                           <div className="flex items-center gap-1">
                             <MapPin className="h-3 w-3" />
                             Community Itinerary
                           </div>
                        </div>
                        <Button variant="default" size="sm" asChild>
                          <Link href={`/public/trips/${item.trip.shareSlug || item.trip.id}`}>
                            View Trip <ExternalLink className="ml-2 h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="w-full md:w-80 shrink-0">
             <Card className="border border-border/50 bg-muted/10">
               <CardContent className="p-6 text-sm text-muted-foreground leading-relaxed">
                 Community section where all the users can share their experience about a certain trip or activity. <br/><br/>
                 Using the search, groupby or filter and sortby option, the user can narrow down the result that he is looking for...
               </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
