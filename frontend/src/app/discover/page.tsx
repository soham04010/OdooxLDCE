"use client";

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Navigation, Clock, ChevronRight, Compass, Star, TrendingUp, Sparkles, Map } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/reveal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DiscoverPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  
  const [selectedCity, setSelectedCity] = useState<any | null>(null);
  const [cityActivities, setCityActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  // Some seeded cities have an image_url that 404s; fall back to the placeholder.
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/cities", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setCities(json.cities);
        }
      } catch (err) {}
    };
    fetchCities();
  }, []);

  const filteredCities = useMemo(() => {
    let result = cities;
    
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || (c.country && c.country.toLowerCase().includes(q)));
    }
    
    // Category filter
    if (category === "trending") result = [...result].sort((a, b) => b.popularity - a.popularity);
    if (category === "budget") result = [...result].filter(c => c.costIndex < 50);
    if (category === "luxury") result = [...result].filter(c => c.costIndex >= 70);

    return result;
  }, [cities, search, category]);

  const handleCityClick = async (city: any) => {
    setSelectedCity(city);
    setLoadingActivities(true);
    setCityActivities([]);
    try {
      const res = await fetch(`http://localhost:5000/api/activities?cityId=${city.id}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setCityActivities(json.activities);
      }
    } catch (err) {} finally {
      setLoadingActivities(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] font-sans selection:bg-primary/20">
      <Navbar />

      {/* Dynamic Hero Section with Parallax feel */}
      <div className="relative overflow-hidden pt-20 pb-24 lg:pt-32 lg:pb-40 border-b dark:border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <Badge className="mb-6 px-4 py-1.5 bg-background shadow-sm border text-primary hover:bg-background rounded-full font-bold uppercase tracking-widest text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-2 inline-block" /> Explore The World
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
            Where to next?
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
            Discover stunning destinations, uncover hidden gems, and curate the perfect itinerary for your upcoming journey.
          </p>
          
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-background/80 backdrop-blur-xl rounded-full shadow-2xl border dark:border-zinc-800 p-2 overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/50">
              <div className="pl-6 text-primary"><Search className="w-6 h-6"/></div>
              <Input 
                placeholder="Search for cities, countries, or regions..." 
                className="border-0 shadow-none focus-visible:ring-0 text-lg py-6 bg-transparent placeholder:text-zinc-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        
        {/* Dynamic Categorization */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 animate-in fade-in duration-700 delay-150 fill-mode-both">
          <h2 className="text-3xl font-extrabold flex items-center gap-3">
            <Map className="w-8 h-8 text-primary" /> 
            Destinations
          </h2>
          
          <Tabs value={category} onValueChange={setCategory} className="w-full md:w-auto">
            <TabsList className="w-full md:w-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-full">
              <TabsTrigger value="all" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="trending" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:shadow-sm"><TrendingUp className="w-4 h-4 mr-2"/> Trending</TabsTrigger>
              <TabsTrigger value="budget" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:shadow-sm">Budget</TabsTrigger>
              <TabsTrigger value="luxury" className="rounded-full px-6 py-2.5 font-bold data-[state=active]:shadow-sm"><Star className="w-4 h-4 mr-2"/> Luxury</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredCities.length === 0 ? (
          <div className="text-center py-32 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <Compass className="w-12 h-12 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h3 className="text-2xl font-black mb-2">Available soon</h3>
            <p className="text-muted-foreground text-lg">Try adjusting your search or switching categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCities.map((city, idx) => (
              <Reveal key={city.id} delay={Math.min(idx, 8) * 60}>
              <Card 
                className={`card-pop p-0 gap-0 overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-background rounded-3xl animate-in fade-in slide-in-from-bottom-12 fill-mode-both ${idx === 0 && category === 'trending' ? 'sm:col-span-2 sm:row-span-2' : ''}`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => handleCityClick(city)}
              >
                <div className={`w-full relative overflow-hidden bg-muted ${idx === 0 && category === 'trending' ? 'h-64 sm:h-[400px]' : 'h-64'}`}>
                  {city.imageUrl && !brokenImages.has(city.id) ? (
                    <img
                      src={city.imageUrl}
                      alt={city.name}
                      onError={() =>
                        setBrokenImages((prev) => new Set(prev).add(city.id))
                      }
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-secondary text-primary/40">
                      <Navigation className="w-10 h-10" />
                      <span className="text-xs font-semibold uppercase tracking-widest">
                        No photo yet
                      </span>
                    </div>
                  )}
                  
                  {/* Dynamic Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
                  
                  {/* Category Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {city.popularity > 80 && <Badge className="bg-high-sea text-marine hover:bg-high-sea/90 border-0 font-black"><TrendingUp className="w-3 h-3 mr-1"/> HOT</Badge>}
                    {city.costIndex < 50 && <Badge className="bg-wave text-white hover:bg-wave/90 border-0 font-black">BUDGET</Badge>}
                  </div>

                  {/* Content Overlay */}
                  <div className="absolute bottom-6 left-6 right-6 transform group-hover:-translate-y-2 transition-transform duration-500">
                    <h3 className={`font-black text-white drop-shadow-lg leading-tight mb-2 ${idx === 0 && category === 'trending' ? 'text-4xl' : 'text-2xl'}`}>
                      {city.name}
                    </h3>
                    <div className="flex items-center justify-between text-zinc-300">
                      {city.country && <p className="text-sm font-semibold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {city.country}</p>}
                    </div>
                  </div>
                </div>
              </Card>
              </Reveal>
            ))}
          </div>
        )}
      </main>

      {/* Dynamic Glassmorphic Activity Modal */}
      <Dialog open={!!selectedCity} onOpenChange={(open) => !open && setSelectedCity(null)}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden bg-transparent border-0 shadow-none">
          {selectedCity && (
            <div className="flex flex-col md:flex-row h-full max-h-[90vh] bg-background/95 backdrop-blur-3xl rounded-3xl shadow-2xl border dark:border-zinc-800 overflow-hidden relative">
              
              {/* Left sidebar - City Info */}
              <div className="w-full md:w-5/12 relative">
                <div className="h-64 md:h-full w-full absolute inset-0">
                   {selectedCity.imageUrl ? (
                    <img src={selectedCity.imageUrl} alt={selectedCity.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:bg-gradient-to-r md:from-black/90 md:via-black/50 md:to-transparent" />
                </div>
                <div className="relative p-8 md:p-12 h-full flex flex-col justify-end md:justify-center text-white">
                  <Badge className="w-fit mb-6 bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-md px-4 py-1 text-xs tracking-widest uppercase">Destination</Badge>
                  <h2 className="text-5xl font-black mb-4 leading-tight">{selectedCity.name}</h2>
                  <p className="text-zinc-300 text-xl font-medium flex items-center gap-2 mb-10">
                    <MapPin className="w-6 h-6 text-primary" /> {selectedCity.country || selectedCity.region}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    <div className="bg-black/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 hover:bg-black/60 transition-colors">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Popularity</p>
                      <div className="flex items-end gap-2">
                        <span className="font-black text-3xl">{selectedCity.popularity}</span>
                        <span className="text-zinc-500 font-bold pb-1">/100</span>
                      </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-xl p-5 rounded-2xl border border-white/10 hover:bg-black/60 transition-colors">
                      <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Cost Index</p>
                      <div className="flex items-end gap-2">
                        <span className="font-black text-3xl">{selectedCity.costIndex}</span>
                        <span className="text-zinc-500 font-bold pb-1">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right content - Activities */}
              <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col h-[60vh] md:h-[90vh]">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-3xl font-black flex items-center gap-3">
                    <Compass className="w-8 h-8 text-primary" /> Top Experiences
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                  {loadingActivities ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 animate-in fade-in">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <p className="text-muted-foreground font-bold animate-pulse">Curating experiences...</p>
                    </div>
                  ) : cityActivities.length === 0 ? (
                    <div className="text-center py-20 bg-muted/50 rounded-3xl border border-dashed animate-in fade-in">
                      <Compass className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-xl font-bold mb-2">No experiences cataloged</h3>
                      <p className="text-muted-foreground">Check back later for curated activities.</p>
                    </div>
                  ) : (
                    cityActivities.map((act, idx) => (
                      <div 
                        key={act.id} 
                        className="flex gap-6 p-4 rounded-3xl border bg-card hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-primary/50 transition-all duration-300 group cursor-pointer animate-in fade-in slide-in-from-right-8 fill-mode-both"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        <div className="w-32 h-32 rounded-2xl bg-muted flex-shrink-0 overflow-hidden relative shadow-inner">
                          {act.imageUrl ? (
                            <img src={act.imageUrl} alt={act.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/40"><Compass className="w-10 h-10" /></div>
                          )}
                          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-black shadow-sm">
                            ${act.cost}
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <Badge variant="outline" className="w-fit mb-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground border-zinc-200 dark:border-zinc-800">
                            {act.type || 'Experience'}
                          </Badge>
                          <h4 className="font-black text-xl leading-tight group-hover:text-primary transition-colors mb-2">{act.name}</h4>
                          {act.description && <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{act.description}</p>}
                          
                          <div className="flex items-center gap-4 mt-auto">
                            {act.durationMinutes && (
                              <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-primary" /> 
                                {Math.floor(act.durationMinutes / 60)}h {act.durationMinutes % 60}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
