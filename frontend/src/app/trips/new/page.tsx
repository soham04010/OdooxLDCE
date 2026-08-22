"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/date-picker";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type City = {
  id: string;
  name: string;
  country: string;
  region?: string | null;
  imageUrl?: string | null;
};

type Country = {
  country: string;
  cities: string[];
};

type ApiError = {
  error?: string;
  message?: string;
};

type CreatedTrip = ApiError & {
  id?: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34";

export default function CreateTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [dbCities, setDbCities] = useState<City[]>([]);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [countriesData, setCountriesData] = useState<Country[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/cities", {
          credentials: "include",
        });

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not load city suggestions.");
        }

        const data = (await response.json()) as { cities?: City[] };
        if (!cancelled) {
          const cities = data.cities ?? [];
          setDbCities(cities);
          setSuggestions(cities.slice(0, 6));
        }
      } catch (fetchError) {
        console.error(fetchError);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    };

    const fetchCountries = async () => {
      try {
        const response = await fetch(
          "https://countriesnow.space/api/v0.1/countries"
        );
        if (!response.ok) {
          throw new Error("Could not load countries and cities.");
        }

        const data = (await response.json()) as { data?: Country[] };
        if (!cancelled) setCountriesData(data.data ?? []);
      } catch (fetchError) {
        console.error(fetchError);
      } finally {
        if (!cancelled) setLoadingCountries(false);
      }
    };

    void fetchSuggestions();
    void fetchCountries();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const availableCities =
    countriesData.find((entry) => entry.country === selectedCountry)?.cities ??
    [];

  const handleSuggestionClick = (city: City) => {
    setSelectedCountry(city.country);
    setSelectedCity(city.name);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (endDate < startDate) {
      setError("Your end date is before your start date.");
      return;
    }

    setIsSaving(true);

    try {
      // 1. Find the selected city in our database or create it first.
      const existingCity = dbCities.find(
        (city) =>
          city.name.toLowerCase() === selectedCity.toLowerCase() &&
          city.country.toLowerCase() === selectedCountry.toLowerCase()
      );

      let cityId = existingCity?.id;

      if (!cityId) {
        const cityResponse = await fetch("http://localhost:5000/api/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedCity,
            country: selectedCountry,
          }),
          credentials: "include",
        });
        const cityData = (await cityResponse.json()) as City & ApiError;

        if (!cityResponse.ok || !cityData.id) {
          throw new Error(cityData.error || "Could not save the selected city.");
        }

        cityId = cityData.id;
      }

      // 2. Create the trip using the authenticated session cookie.
      const tripResponse = await fetch("http://localhost:5000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          startDate,
          endDate,
          // Carry the chosen city's photo onto the trip card. Newly created
          // cities have no image yet, so fall back to a generic travel shot.
          coverPhotoUrl: existingCity?.imageUrl || fallbackImage,
        }),
        credentials: "include",
      });
      const newTrip = (await tripResponse.json()) as CreatedTrip;

      if (!tripResponse.ok || !newTrip.id) {
        throw new Error(newTrip.error || "Could not create the trip.");
      }

      // 3. Add the selected city as the trip's first stop.
      const stopResponse = await fetch(
        `http://localhost:5000/api/trips/${newTrip.id}/stops`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityId,
            orderIndex: 0,
            startDate,
            endDate,
            budget: 0,
          }),
          credentials: "include",
        }
      );

      if (!stopResponse.ok) {
        const stopError = (await stopResponse.json()) as ApiError;
        throw new Error(stopError.error || "Could not add the first stop.");
      }

      // 4. Continue to the itinerary builder for the new trip.
      router.push(`/trips/${newTrip.id}`);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "That did not save. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight">
          Create a new Trip
        </h1>

        <Card className="mb-10 gap-0 border border-border/50 py-0 shadow-sm">
          <CardHeader className="border-b bg-muted/20 px-6 py-4">
            <CardTitle className="text-lg font-bold">Plan a new trip</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive"
                >
                  {error}
                </p>
              )}

              <Field label="Trip Name:" htmlFor="name">
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Euro Summer"
                  required
                  className="h-11 max-w-md"
                />
              </Field>

              <Field label="Select a Place:" htmlFor="country">
                <div className="flex max-w-md flex-col gap-2">
                  <select
                    id="country"
                    name="country"
                    value={selectedCountry}
                    onChange={(event) => {
                      setSelectedCountry(event.target.value);
                      setSelectedCity("");
                    }}
                    required
                    disabled={loadingCountries}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {loadingCountries
                        ? "Loading countries..."
                        : "Select Country..."}
                    </option>
                    {countriesData.map((country) => (
                      <option key={country.country} value={country.country}>
                        {country.country}
                      </option>
                    ))}
                    {selectedCountry &&
                      !countriesData.some(
                        (country) => country.country === selectedCountry
                      ) && (
                        <option value={selectedCountry}>{selectedCountry}</option>
                      )}
                  </select>

                  <select
                    id="city"
                    name="city"
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    required
                    disabled={!selectedCountry}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select City...</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                    {selectedCity &&
                      !availableCities.includes(selectedCity) && (
                        <option value={selectedCity}>{selectedCity}</option>
                      )}
                  </select>
                </div>
              </Field>

              <Field label="Start Date:" htmlFor="startDate">
                <DatePicker
                  id="startDate"
                  name="startDate"
                  value={startDate}
                  onChange={setStartDate}
                  required
                  placeholder="Pick a start date"
                  className="max-w-[220px]"
                />
              </Field>

              <Field label="End Date:" htmlFor="endDate">
                <DatePicker
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={setEndDate}
                  required
                  placeholder="Pick an end date"
                  className="max-w-[220px]"
                />
              </Field>

              <div className="flex justify-end pt-1 sm:pl-[176px] sm:justify-start">
                <Button
                  type="submit"
                  disabled={isSaving || !selectedCity}
                  className="h-11 w-full gap-2 px-6 text-base sm:w-auto sm:min-w-40"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Trip
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section aria-labelledby="suggestions-heading">
          <h2
            id="suggestions-heading"
            className="mb-4 text-lg font-semibold tracking-tight"
          >
            Suggestions for places to visit and activities to perform
          </h2>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
            {loadingSuggestions ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-40 rounded-xl" />
              ))
            ) : suggestions.length > 0 ? (
              suggestions.map((city) => {
                const selected =
                  selectedCountry === city.country &&
                  selectedCity === city.name;

                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleSuggestionClick(city)}
                    aria-pressed={selected}
                    className={cn(
                      "group relative h-40 overflow-hidden rounded-xl border bg-card text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-44",
                      selected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-primary/20 hover:border-primary hover:shadow-md"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={city.imageUrl || fallbackImage}
                      alt={`${city.name}, ${city.country}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/25"
                    />
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="block truncate font-bold">
                        {city.name}
                      </span>
                      <span className="block truncate text-xs text-gray-200">
                        {city.country}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-dashed py-8 text-center text-muted-foreground">
                No suggestions available.
              </div>
            )}
          </div>
        </section>
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
    <div className="grid gap-2 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
      <Label
        htmlFor={htmlFor}
        className="text-sm font-medium text-muted-foreground sm:text-right"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
