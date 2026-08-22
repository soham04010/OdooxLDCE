"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CURRENCY_MAP: Record<string, string> = {
  'United States': '$', 'USA': '$', 'India': '₹', 'United Kingdom': '£',
  'France': '€', 'Germany': '€', 'Italy': '€', 'Spain': '€', 'Japan': '¥',
  'Australia': 'A$', 'Canada': 'C$', 'Brazil': 'R$', 'China': '¥'
};
const getCurrency = (country: string) => CURRENCY_MAP[country] || '$';

function BudgetDisplay({ stopId, tripId, initialBudget, onUpdate, spent, currency }: any) {
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!val) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/stops/${stopId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget: val, _method: "PATCH" }),
        credentials: "include"
      });
      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`);
      }
      onUpdate();
    } catch (e: any) {
      console.error("Failed to update budget:", e);
      alert("Network error: Could not update budget. Please ensure backend is running at localhost:5000.");
    } finally {
      setSaving(false);
    }
  };

  if (Number(initialBudget) === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{currency}</span>
        <Input type="number" step="0.01" className="h-7 w-20 px-2 text-xs" value={val} onChange={e=>setVal(e.target.value)} placeholder="0.00" />
        <Button size="sm" className="h-7 text-xs px-2" onClick={handleSave} disabled={saving}>Set</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{currency}{Number(initialBudget).toFixed(2)}</span>
      {spent > Number(initialBudget) && (
         <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold animate-pulse">Over Limit</span>
      )}
    </div>
  );
}

export default function BuildItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id;
  
  const [data, setData] = useState<{ trip: any, stops: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  
  // Dependencies data
  const [cities, setCities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);

  const fetchTrip = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}`, { credentials: "include" });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
    // Fetch cities for Add Stop dropdown
    fetch("http://localhost:5000/api/cities", { credentials: "include" })
      .then(res => res.json())
      .then(json => setCities(json.cities || []));
  }, [tripId]);

  const handleAddStopClick = () => {
    setIsAddStopModalOpen(true);
  };

  const handleAddActivityClick = async (stopId: string, cityId: string) => {
    setActiveStopId(stopId);
    setActiveCityId(cityId);
    setIsAddActivityModalOpen(true);
    
    // Fetch activities for this specific city
    try {
      const res = await fetch(`http://localhost:5000/api/activities?cityId=${cityId}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setActivities(json || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddActivitySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    const formData = new FormData(e.currentTarget);
    const activityName = formData.get("activityName") as string;
    const dateStr = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const customCost = formData.get("costOverride") as string;

    try {
      // Create activity on the fly
      const actRes = await fetch("http://localhost:5000/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: activeCityId,
          name: activityName,
          type: "activity",
          cost: customCost || 0,
        }),
        credentials: "include"
      });
      const newAct = await actRes.json();

      // Find the stop to calculate dayNumber
      const stop = data?.stops.find(s => s.stop.id === activeStopId);
      const startD = new Date(stop.stop.startDate);
      const actD = new Date(dateStr);
      let dayNumber = Math.floor((actD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNumber < 1) dayNumber = 1;

      // Add to itinerary
      await fetch(`http://localhost:5000/api/stops/${activeStopId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: newAct.id,
          dayNumber,
          startTime,
          costOverride: customCost || undefined,
        }),
        credentials: "include"
      });
      setIsAddActivityModalOpen(false);
      fetchTrip(); // reload
    } catch (e) {
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };

  const totalBudget = data?.stops.reduce((acc, stop) => acc + Number(stop.stop.budget || 0), 0) || 0;
  const totalSpend = data?.stops.reduce((acc, stop) => {
    return acc + stop.activities.reduce((sum: number, act: any) => sum + Number(act.item.costOverride || act.activity.cost || 0), 0);
  }, 0) || 0;
  
  const mainCurrency = data?.stops && data.stops.length > 0 ? getCurrency(data.stops[0].city.country) : '$';

  return (
    <div className="min-h-screen bg-background font-sans relative">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">GlobalTrotter Itinerary Builder</h1>
          {data && (
            <Button 
              variant={data.trip.isPublic ? "secondary" : "default"} 
              onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:5000/api/trips/${tripId}/visibility`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPublic: !data.trip.isPublic, description: data.trip.description || "My amazing trip!" }),
                    credentials: "include"
                  });
                  if (res.ok) {
                    fetchTrip();
                    alert(data.trip.isPublic ? "Trip made private." : "Trip published to community!");
                  }
                } catch (err) {
                  console.error("Fetch failed, likely blocked by adblocker:", err);
                  alert("Failed to update visibility. If you are using Brave or an Adblocker, try turning shields down.");
                }
              }}
            >
              {data.trip.isPublic ? "Unpublish" : "Publish to Community"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
             <Skeleton className="w-full h-40 rounded-lg" />
             <Skeleton className="w-full h-40 rounded-lg" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-lg">Trip not found or unauthorized</div>
        ) : (
          <div className="space-y-6">
            
            <Card className="border border-border/80 shadow-sm bg-muted/10 mb-8">
               <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
                 <div>
                   <h2 className="text-lg font-bold mb-1">Overall Expense & Budget</h2>
                   <p className="text-sm text-muted-foreground">Keep track of your spending across all sections.</p>
                 </div>
                 <div className="flex gap-8 text-center">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Budget</div>
                      <div className="text-2xl font-bold">{mainCurrency}{totalBudget.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Spent</div>
                      <div className={`text-2xl font-bold ${totalSpend > totalBudget && totalBudget > 0 ? "text-destructive" : ""}`}>
                        {mainCurrency}{totalSpend.toFixed(2)}
                      </div>
                    </div>
                 </div>
               </CardContent>
            </Card>

            {data.stops.length === 0 ? (
               <Card className="border border-border text-center py-12 shadow-sm">
                 <h2 className="text-xl font-bold mb-2">No Sections Added</h2>
                 <p className="text-muted-foreground mb-4">You haven't added any stops (sections) to this trip yet.</p>
               </Card>
            ) : (
              data.stops.map((stopItem: any, index: number) => {
                const sectionSpent = stopItem.activities.reduce((sum: number, act: any) => sum + Number(act.item.costOverride || act.activity.cost || 0), 0);
                
                return (
                <Card key={stopItem.stop.id} className="border border-border/80 shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">Section {index + 1}: {stopItem.city.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      All the necessary information about this section. This can be anything like travel section, hotel or any other activity.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 border rounded-md px-4 py-2 text-sm flex items-center justify-between">
                        <span className="text-muted-foreground">Date Range:</span>
                        <span className="font-medium">
                           {new Date(stopItem.stop.startDate).toLocaleDateString()} to {new Date(stopItem.stop.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex-1 border rounded-md px-4 py-2 text-sm flex items-center justify-between">
                        <span className="text-muted-foreground">Budget of this section:</span>
                        <BudgetDisplay 
                          stopId={stopItem.stop.id} 
                          tripId={tripId} 
                          initialBudget={stopItem.stop.budget} 
                          onUpdate={fetchTrip} 
                          spent={sectionSpent}
                          currency={getCurrency(stopItem.city.country)}
                        />
                      </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                       <h4 className="font-semibold text-sm mb-3 flex items-center justify-between">
                         Activities
                         <span className="text-xs text-muted-foreground font-normal bg-muted/50 px-2 py-1 rounded">
                           Section Spent: {getCurrency(stopItem.city.country)}{sectionSpent.toFixed(2)}
                         </span>
                       </h4>
                       {stopItem.activities.length === 0 ? (
                          <p className="text-xs text-muted-foreground mb-3">No activities planned for this section yet.</p>
                       ) : (
                         <div className="space-y-2 mb-4">
                           {stopItem.activities.map((act: any) => (
                             <div key={act.item.id} className="text-sm flex justify-between bg-muted/30 p-2 rounded border">
                               <div className="flex items-center space-x-4">
                                 <span className="font-medium w-24 text-muted-foreground">Day {act.item.dayNumber} - {act.item.startTime || "TBD"}</span>
                                 <span>{act.activity.name}</span>
                               </div>
                               <span className="font-medium">{getCurrency(stopItem.city.country)}{act.item.costOverride || act.activity.cost}</span>
                             </div>
                           ))}
                         </div>
                       )}
                       <Button variant="outline" size="sm" onClick={() => handleAddActivityClick(stopItem.stop.id, stopItem.city.id)}>
                         <Plus className="w-4 h-4 mr-2"/> Add Activity to Section
                       </Button>
                    </div>

                  </CardContent>
                </Card>
              )})
            )}

            <Button variant="outline" className="w-full border-dashed h-14" onClick={handleAddStopClick}>
              <Plus className="w-5 h-5 mr-2" /> Add another Section
            </Button>

          </div>
        )}
      </main>

      {/* Add Stop Modal */}
      {isAddStopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-md shadow-xl border-border my-8">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add a New Section (Stop)</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddStopModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardContent className="p-4">
              <AddStopForm 
                tripId={tripId as string} 
                cities={cities} 
                onSuccess={() => {
                  setIsAddStopModalOpen(false);
                  fetchTrip();
                }} 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Activity Modal */}
      {isAddActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-xl border-border">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg">Add Activity</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddActivityModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleAddActivitySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Activity / Place Name</Label>
                  <Input name="activityName" placeholder="e.g. Visit Eiffel Tower" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time (Optional)</Label>
                    <Input name="startTime" type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <Input name="costOverride" type="number" step="0.01" placeholder="0.00" />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Activity"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AddStopForm({ tripId, cities, onSuccess }: { tripId: string, cities: any[], onSuccess: () => void }) {
  const [isCustom, setIsCustom] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [loading, setLoading] = useState(false);

  // Derive unique countries
  const countries = Array.from(new Set(cities.map(c => c.country))).filter(Boolean).sort();
  const filteredCities = cities.filter(c => c.country === selectedCountry);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let cityId = selectedCityId;
      
      if (isCustom) {
        // Create custom city first
        const cityRes = await fetch('http://localhost:5000/api/cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.get('customCityName'),
            country: formData.get('customCountryName'),
            region: formData.get('customRegion') || null
          }),
          credentials: 'include'
        });
        const cityData = await cityRes.json();
        cityId = cityData.id;
      }

      const payload = {
        cityId,
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        budget: formData.get('budget'),
        orderIndex: 0
      };

      await fetch(`http://localhost:5000/api/trips/${tripId}/stops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      
      onSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-2">
        <input type="checkbox" id="customToggle" checked={isCustom} onChange={(e) => setIsCustom(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
        <label htmlFor="customToggle" className="text-sm font-medium">Add a custom city (not in catalog)</label>
      </div>

      {!isCustom ? (
        <div className="space-y-3 p-3 bg-muted/20 border rounded-md">
          <div className="space-y-1">
            <Label>Country</Label>
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} required className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select Country...</option>
              {countries.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} required disabled={!selectedCountry} className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50">
              <option value="">Select City...</option>
              {filteredCities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-muted/20 border rounded-md">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>City Name</Label>
              <Input name="customCityName" placeholder="e.g. Venice" required />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input name="customCountryName" placeholder="e.g. Italy" required />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Input name="startDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Input name="endDate" type="date" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Budget Estimate ($)</Label>
        <Input name="budget" type="number" step="0.01" placeholder="500.00" required />
      </div>

      <Button type="submit" className="w-full mt-2" disabled={loading || (!isCustom && !selectedCityId)}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Section"}
      </Button>
    </form>
  );
}
