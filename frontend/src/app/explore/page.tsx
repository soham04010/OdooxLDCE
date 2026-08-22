"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Compass, Plus, X, Loader2, Plane, Hotel, Utensils, Globe, TrendingUp, Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { toast } from "sonner";
import { toggleWishlistCity, isCityWishlisted } from "@/lib/personalization";

const CATEGORY_ICONS: Record<string, any> = {
  activity: Compass,
  transport: Plane,
  stay: Hotel,
  meal: Utensils
};

export default function ExplorePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "city" | "activity">("all");
  const [results, setResults] = useState<any[]>([]);
  const [userTrips, setUserTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add to Trip Modal state
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [addingStop, setAddingStop] = useState(false);

  const fetchResults = async (q = "", type = "all") => {
    setLoading(true);
    try {
      const typeParam = type === "all" ? "" : type;
      const res = await fetch(`http://localhost:5000/api/search?q=${encodeURIComponent(q)}&type=${typeParam}`);
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults(query, filterType);
    fetch("http://localhost:5000/api/trips", { credentials: "include" })
      .then(res => res.ok ? res.json() : [])
      .then(data => setUserTrips(data || []))
      .catch(console.error);
  }, []);

  const handleFilterChange = (type: "all" | "city" | "activity") => {
    setFilterType(type);
    fetchResults(query, type);
  };

  const handleAddToTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCity || !selectedTripId) return;
    setAddingStop(true);

    try {
      const res = await fetch(`http://localhost:5000/api/trips/${selectedTripId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: selectedCity.id,
          startDate,
          endDate,
          budget: budget || 0,
          orderIndex: 0
        }),
        credentials: "include"
      });

      if (res.ok) {
        toast.success(`${selectedCity.name} added to your trip!`);
        setSelectedCity(null);
        router.push(`/trips/${selectedTripId}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to add stop to trip");
    } finally {
      setAddingStop(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-marine dark:text-foreground">
            Explore Destinations & Activities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search through global cities, view popularity ratings, cost indexes, and build your trip.
          </p>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-8">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cities or activities..."
              className="pl-10 h-11 bg-card border-border/80 text-sm shadow-2xs focus-visible:ring-wave"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                fetchResults(e.target.value, filterType);
              }}
            />
            {query && (
              <button 
                onClick={() => { setQuery(""); fetchResults("", filterType); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Segmented Control Tabs */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                filterType === "all"
                  ? "bg-card text-marine dark:text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => handleFilterChange("city")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filterType === "city"
                  ? "bg-card text-marine dark:text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Cities
            </button>
            <button
              onClick={() => handleFilterChange("activity")}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                filterType === "activity"
                  ? "bg-card text-marine dark:text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Compass className="w-3.5 h-3.5" /> Activities
            </button>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 border border-dashed rounded-xl text-muted-foreground">
            No destinations or activities found matching "{query}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((item, idx) => {
              const isCity = item._resultType === "city";
              const Icon = isCity ? MapPin : (CATEGORY_ICONS[item.type || 'activity'] || Compass);

              return (
                <Card 
                  key={idx} 
                  className="border border-border/80 bg-card p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Metadata Row */}
                    <div className="flex justify-between items-center mb-3 gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-wave bg-wave/10 px-2.5 py-1 rounded-md">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isCity ? `${item.country}${item.region ? ` • ${item.region}` : ''}` : (item.type || "Activity")}
                        </span>
                      </div>

                      {isCity && item.popularity !== undefined && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md">
                          <TrendingUp className="w-3 h-3 text-marine dark:text-primary" />
                          <span>Pop: {item.popularity}/100</span>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-2xl text-marine dark:text-foreground group-hover:text-wave transition-colors tracking-tight">
                      {item.name}
                    </h3>

                    {/* Subtitle / Details */}
                    {!isCity && (
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        In {item.cityName || "Destination"} {item.durationMinutes ? `• ${item.durationMinutes} mins` : ""}
                      </p>
                    )}

                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mt-3">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Bar */}
                  <div className="border-t border-border/60 pt-4 mt-6 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">
                        {isCity ? "Cost Index" : "Estimated Cost"}
                      </div>
                      <div className="text-sm font-bold text-marine dark:text-foreground">
                        {isCity ? `${item.costIndex || 50} / 100` : `$${item.cost || 0}`}
                      </div>
                    </div>

                    {isCity && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            const added = toggleWishlistCity(item.id);
                            toast.success(added ? `${item.name} added to your wishlist!` : `${item.name} removed from wishlist.`);
                            setQuery((q) => q);
                          }}
                          className="h-9 w-9 border-border/80 text-muted-foreground hover:text-red-500 transition-colors"
                          title={isCityWishlisted(item.id) ? "Remove from Wishlist" : "Save to Wishlist"}
                        >
                          <Heart className={`w-4 h-4 ${isCityWishlisted(item.id) ? "fill-red-500 text-red-500" : ""}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setSelectedCity(item)}
                          className="text-xs gap-1.5 h-9 font-semibold"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to Trip
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add City to Trip Modal */}
      {selectedCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl border-border">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-marine dark:text-foreground">
                Add {selectedCity.name} to Trip
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCity(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleAddToTripSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Target Trip</label>
                  {userTrips.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active trips found. Create a trip first in Dashboard.</p>
                  ) : (
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm"
                      required
                    >
                      <option value="">Select a trip...</option>
                      {userTrips.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Section Budget ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={addingStop || !selectedTripId}
                >
                  {addingStop ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Stop to Trip"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
