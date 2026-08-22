"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  const [dbCities, setDbCities] = useState<any[]>([]);
  
  // External API data
  const [countriesData, setCountriesData] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    // Fetch our DB cities for suggestions
    const fetchSuggestions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/cities", {credentials: 'include'});
        if (res.ok) {
          const json = await res.json();
          setDbCities(json.cities || []);
          setSuggestions((json.cities || []).slice(0, 6));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Fetch external countries/cities API
    const fetchCountries = async () => {
      try {
        const res = await fetch("https://countriesnow.space/api/v0.1/countries");
        const json = await res.json();
        setCountriesData(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchSuggestions();
    fetchCountries();
  }, []);

  const availableCities = countriesData.find(c => c.country === selectedCountry)?.cities || [];

  const handleSuggestionClick = (city: any) => {
    // If the external API doesn't have the exact spelling, that's fine, we still set it as a string
    setSelectedCountry(city.country);
    // Give it a tiny delay to allow React to render the newly selected country's cities before setting city
    setTimeout(() => setSelectedCity(city.name), 10);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const tripName = formData.get("name") as string;

    try {
      // 1. Get or Create the City
      let cityId = "";
      const existing = dbCities.find(c => 
        c.name.toLowerCase() === selectedCity.toLowerCase() && 
        c.country.toLowerCase() === selectedCountry.toLowerCase()
      );

      if (existing) {
        cityId = existing.id;
      } else {
        const cityRes = await fetch("http://localhost:5000/api/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: selectedCity, country: selectedCountry }),
          credentials: "include"
        });
        const cityData = await cityRes.json();
        cityId = cityData.id;
      }

      // 2. Create the Trip
      const tripRes = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tripName, startDate, endDate }),
        credentials: "include"
      });
      const newTrip = await tripRes.json();

      // 3. Automatically add the first Stop to the Trip
      if (tripRes.ok && cityId) {
        await fetch(`http://localhost:5000/api/trips/${newTrip.id}/stops`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityId,
            orderIndex: 0,
            startDate,
            endDate,
            budget: 0
          }),
          credentials: "include"
        });
        
        // 4. Redirect to itinerary builder
        router.push(`/trips/${newTrip.id}`);
      }

    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Create a new Trip</h1>

        <Card className="shadow-sm border border-border/50 mb-10">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <CardTitle className="text-lg">Plan a new trip</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <Label htmlFor="name" className="text-right text-muted-foreground font-medium">Trip Name:</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Euro Summer" 
                  required 
                  className="max-w-md"
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] items-start gap-4">
                <Label className="text-right text-muted-foreground font-medium mt-3">Select a Place:</Label>
                <div className="max-w-md flex flex-col gap-2">
                  <select 
                    value={selectedCountry} 
                    onChange={e => { setSelectedCountry(e.target.value); setSelectedCity(""); }} 
                    required 
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={loadingCountries}
                  >
                    <option value="">{loadingCountries ? "Loading countries..." : "Select Country..."}</option>
                    {countriesData.map((c: any) => (
                      <option key={c.country} value={c.country}>{c.country}</option>
                    ))}
                    {/* Fallback if the suggestion country isn't perfectly mapped */}
                    {selectedCountry && !countriesData.some(c => c.country === selectedCountry) && (
                       <option value={selectedCountry}>{selectedCountry}</option>
                    )}
                  </select>
                  
                  <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)} 
                    required 
                    className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    disabled={!selectedCountry}
                  >
                    <option value="">Select City...</option>
                    {availableCities.map((city: string) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    {/* Fallback if the suggestion city isn't perfectly mapped */}
                    {selectedCity && !availableCities.includes(selectedCity) && (
                       <option value={selectedCity}>{selectedCity}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <Label htmlFor="startDate" className="text-right text-muted-foreground font-medium">Start Date:</Label>
                <Input 
                  id="startDate" 
                  name="startDate" 
                  type="date" 
                  required 
                  className="max-w-[200px]"
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] items-center gap-4">
                <Label htmlFor="endDate" className="text-right text-muted-foreground font-medium">End Date:</Label>
                <Input 
                  id="endDate" 
                  name="endDate" 
                  type="date" 
                  required 
                  className="max-w-[200px]"
                />
              </div>

              <div className="grid grid-cols-[150px_1fr] items-center gap-4 pt-4">
                <div />
                <Button type="submit" disabled={isLoading || !selectedCity} className="max-w-[200px]">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Trip
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Suggestion for Places to Visit/Activites to preform</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {loadingSuggestions ? (
               Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-lg" />)
            ) : suggestions.length > 0 ? (
               suggestions.map((city) => (
                 <Card 
                   key={city.id} 
                   onClick={() => handleSuggestionClick(city)}
                   className="overflow-hidden h-40 relative group cursor-pointer border-primary/20 hover:border-primary transition-colors"
                 >
                    <img 
                      src={city.imageUrl || `https://images.unsplash.com/photo-1502602898657-3e91760cbb34`} 
                      alt={city.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold">{city.name}</h3>
                      <p className="text-xs text-gray-200">{city.country}</p>
                    </div>
                 </Card>
               ))
            ) : (
               <div className="col-span-full text-center text-muted-foreground py-8 border rounded-lg border-dashed">
                 No suggestions available.
               </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
