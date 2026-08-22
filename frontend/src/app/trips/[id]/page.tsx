"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Loader2, Calendar, PieChart as PieIcon, List, Share2, Copy, MapPin, Plane, Hotel, Utensils, Compass } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const CURRENCY_MAP: Record<string, string> = {
  'United States': '$', 'USA': '$', 'India': '₹', 'United Kingdom': '£',
  'France': '€', 'Germany': '€', 'Italy': '€', 'Spain': '€', 'Japan': '¥',
  'Australia': 'A$', 'Canada': 'C$', 'Brazil': 'R$', 'China': '¥'
};
const getCurrency = (country: string) => CURRENCY_MAP[country] || '$';

const CATEGORY_ICONS: Record<string, any> = {
  activity: Compass,
  transport: Plane,
  stay: Hotel,
  meal: Utensils
};

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
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      onUpdate();
      toast.success("Section budget updated!");
    } catch (e: any) {
      console.error("Failed to update budget:", e);
      toast.error("Could not update budget. Ensure backend is running.");
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
      <span className="font-semibold text-marine dark:text-foreground">{currency}{Number(initialBudget).toFixed(2)}</span>
      {spent > Number(initialBudget) && (
        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold animate-pulse">Over Budget</span>
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
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "analytics">("list");
  
  // Modals state
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  
  // Dependencies data
  const [cities, setCities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copying, setCopying] = useState(false);

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
    const category = formData.get("category") as string || "activity";

    try {
      const actRes = await fetch("http://localhost:5000/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: activeCityId,
          name: activityName,
          type: category,
          cost: customCost || 0,
        }),
        credentials: "include"
      });
      const newAct = await actRes.json();

      const stop = data?.stops.find(s => s.stop.id === activeStopId);
      const startD = new Date(stop.stop.startDate);
      const actD = new Date(dateStr);
      let dayNumber = Math.floor((actD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (dayNumber < 1) dayNumber = 1;

      await fetch(`http://localhost:5000/api/stops/${activeStopId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: newAct.id,
          dayNumber,
          startTime,
          category,
          costOverride: customCost || undefined,
        }),
        credentials: "include"
      });
      setIsAddActivityModalOpen(false);
      fetchTrip();
    } catch (e) {
      console.error(e);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCopyTrip = async () => {
    setCopying(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/copy`, {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        const cloned = await res.json();
        toast.success("Trip copied to your account!");
        router.push(`/trips/${cloned.id}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy trip");
    } finally {
      setCopying(false);
    }
  };

  const totalBudget = data?.stops.reduce((acc, stop) => acc + Number(stop.stop.budget || 0), 0) || 0;
  const totalSpend = data?.stops.reduce((acc, stop) => {
    return acc + stop.activities.reduce((sum: number, act: any) => sum + Number(act.item.costOverride || act.activity.cost || 0), 0);
  }, 0) || 0;
  
  const mainCurrency = data?.stops && data.stops.length > 0 ? getCurrency(data.stops[0].city.country) : '$';

  // Analytics Data preparation
  const categoryCosts: Record<string, number> = { activity: 0, transport: 0, stay: 0, meal: 0 };
  const stopBudgetData: any[] = [];

  data?.stops.forEach((stopItem: any) => {
    let stopSpent = 0;
    stopItem.activities.forEach((act: any) => {
      const c = Number(act.item.costOverride || act.activity.cost || 0);
      const cat = act.item.category || act.activity.type || 'activity';
      categoryCosts[cat] = (categoryCosts[cat] || 0) + c;
      stopSpent += c;
    });
    stopBudgetData.push({
      name: stopItem.city.name,
      Budget: Number(stopItem.stop.budget || 0),
      Spent: stopSpent
    });
  });

  const pieChartData = Object.keys(categoryCosts).map(cat => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: categoryCosts[cat]
  })).filter(x => x.value > 0);

  const BRAND_COLORS = ['#142b51', '#376fb7', '#f0cfac', '#f68620'];

  return (
    <div className="min-h-screen bg-background font-sans relative">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-marine dark:text-foreground">
              {data?.trip?.name || "GlobalTrotter Itinerary"}
            </h1>
            {data?.trip?.description && (
              <p className="text-sm text-muted-foreground mt-1">{data.trip.description}</p>
            )}
          </div>
          
          {data && (
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleCopyTrip} disabled={copying}>
                {copying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                Copy Trip
              </Button>
              <Button 
                variant={data.trip.isPublic ? "secondary" : "default"} 
                size="sm"
                onClick={async () => {
                  try {
                    const res = await fetch(`http://localhost:5000/api/trips/${tripId}/publish`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isPublic: !data.trip.isPublic, description: data.trip.description || "My travel plan!" }),
                      credentials: "include"
                    });
                    if (res.ok) {
                      toast.success(data.trip.isPublic ? "Trip made private." : "Trip published to community!");
                      fetchTrip();
                    } else {
                      toast.error("Failed to update publish status");
                    }
                  } catch (e: any) {
                    console.error(e);
                    toast.error("Network error: Backend server at localhost:5000 unreachable.");
                  }
                }}
              >
                {data.trip.isPublic ? "Unpublish" : "Publish to Community"}
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-32 rounded-xl" />
            <Skeleton className="w-full h-64 rounded-xl" />
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-muted-foreground border border-dashed rounded-xl">Trip not found or unauthorized</div>
        ) : (
          <div className="space-y-6">
            
            {/* Overview Card */}
            <Card className="border border-border/80 shadow-sm bg-card">
              <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold mb-1 text-marine dark:text-foreground">Trip Summary</h2>
                  <p className="text-sm text-muted-foreground">
                    {data.stops.length} Section{data.stops.length !== 1 ? 's' : ''} planned
                  </p>
                </div>
                <div className="flex gap-8 text-center">
                  <div className="border-r pr-8">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Total Budget</div>
                    <div className="text-2xl font-bold text-marine dark:text-foreground">{mainCurrency}{totalBudget.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Total Spent</div>
                    <div className={`text-2xl font-bold ${totalSpend > totalBudget && totalBudget > 0 ? "text-destructive" : "text-wave dark:text-primary"}`}>
                      {mainCurrency}{totalSpend.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Modes Switcher */}
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex bg-muted p-1 rounded-lg gap-1">
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("list")}
                  className="text-xs gap-1.5"
                >
                  <List className="w-4 h-4" /> Itinerary List
                </Button>
                <Button 
                  variant={viewMode === "calendar" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("calendar")}
                  className="text-xs gap-1.5"
                >
                  <Calendar className="w-4 h-4" /> Timeline View
                </Button>
                <Button 
                  variant={viewMode === "analytics" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("analytics")}
                  className="text-xs gap-1.5"
                >
                  <PieIcon className="w-4 h-4" /> Budget Analytics
                </Button>
              </div>

              <Button size="sm" onClick={handleAddStopClick} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Section
              </Button>
            </div>

            {/* TAB 1: LIST VIEW */}
            {viewMode === "list" && (
              <div className="space-y-6">
                {data.stops.length === 0 ? (
                  <Card className="border text-center py-12 shadow-sm">
                    <h2 className="text-xl font-bold mb-2">No Sections Added</h2>
                    <p className="text-muted-foreground mb-4">Click "Add Section" to add your first destination stop.</p>
                  </Card>
                ) : (
                  data.stops.map((stopItem: any, index: number) => {
                    const sectionSpent = stopItem.activities.reduce((sum: number, act: any) => sum + Number(act.item.costOverride || act.activity.cost || 0), 0);
                    
                    return (
                      <Card key={stopItem.stop.id} className="border border-border/80 shadow-sm hover:border-wave/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <Badge variant="outline" className="mb-2 text-xs font-semibold">Section {index + 1}</Badge>
                              <h3 className="font-bold text-xl text-marine dark:text-foreground">{stopItem.city.name}, {stopItem.city.country}</h3>
                            </div>
                            <BudgetDisplay 
                              stopId={stopItem.stop.id} 
                              tripId={tripId} 
                              initialBudget={stopItem.stop.budget} 
                              onUpdate={fetchTrip} 
                              spent={sectionSpent}
                              currency={getCurrency(stopItem.city.country)}
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 bg-muted/30 p-2.5 rounded-lg border w-fit">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(stopItem.stop.startDate).toLocaleDateString()} — {new Date(stopItem.stop.endDate).toLocaleDateString()}</span>
                          </div>

                          {/* Activities */}
                          <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-sm">Activities & Schedule</h4>
                              <span className="text-xs font-medium text-muted-foreground">
                                Spent: {getCurrency(stopItem.city.country)}{sectionSpent.toFixed(2)}
                              </span>
                            </div>

                            {stopItem.activities.length === 0 ? (
                              <p className="text-xs text-muted-foreground mb-4 italic">No activities planned for this section yet.</p>
                            ) : (
                              <div className="space-y-2 mb-4">
                                {stopItem.activities.map((act: any) => {
                                  const CatIcon = CATEGORY_ICONS[act.item.category || act.activity.type || 'activity'] || Compass;
                                  return (
                                    <div key={act.item.id} className="text-sm flex items-center justify-between bg-card p-3 rounded-lg border shadow-2xs">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-md bg-muted text-marine dark:text-foreground">
                                          <CatIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <div className="font-medium text-marine dark:text-foreground">{act.activity.name}</div>
                                          <div className="text-xs text-muted-foreground">Day {act.item.dayNumber} {act.item.startTime ? `• ${act.item.startTime}` : ''}</div>
                                        </div>
                                      </div>
                                      <span className="font-semibold text-sm">{getCurrency(stopItem.city.country)}{act.item.costOverride || act.activity.cost}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <Button variant="outline" size="sm" onClick={() => handleAddActivityClick(stopItem.stop.id, stopItem.city.id)} className="w-full text-xs">
                              <Plus className="w-3.5 h-3.5 mr-1.5"/> Add Activity
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: CALENDAR TIMELINE VIEW */}
            {viewMode === "calendar" && (
              <Card className="border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 text-marine dark:text-foreground">Timeline Breakdown</h3>
                {data.stops.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Add sections to view your timeline.</p>
                ) : (
                  <div className="space-y-6">
                    {data.stops.map((stopItem: any) => (
                      <div key={stopItem.stop.id} className="border-l-2 border-wave pl-4 space-y-3">
                        <div className="font-bold text-md text-marine dark:text-foreground">{stopItem.city.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(stopItem.stop.startDate).toLocaleDateString()} to {new Date(stopItem.stop.endDate).toLocaleDateString()}
                        </div>
                        {stopItem.activities.map((act: any) => (
                          <div key={act.item.id} className="bg-muted/40 p-3 rounded-md border text-sm flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-xs text-wave mr-2">Day {act.item.dayNumber}</span>
                              <span className="font-medium">{act.activity.name}</span>
                            </div>
                            <span className="text-xs font-semibold">{mainCurrency}{act.item.costOverride || act.activity.cost}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* TAB 3: BUDGET ANALYTICS VIEW */}
            {viewMode === "analytics" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border p-6 shadow-sm">
                  <h3 className="font-bold text-md mb-4 text-marine dark:text-foreground">Cost Breakdown by Category</h3>
                  {pieChartData.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-12 text-center">No cost data available yet.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card className="border p-6 shadow-sm">
                  <h3 className="font-bold text-md mb-4 text-marine dark:text-foreground">Budget vs Spent per Section</h3>
                  {stopBudgetData.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-12 text-center">No section budget data available.</p>
                  ) : (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stopBudgetData}>
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Budget" fill="#142b51" />
                          <Bar dataKey="Spent" fill="#376fb7" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Add Stop Modal */}
      {isAddStopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <Card className="w-full max-w-md shadow-xl border-border my-8">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-marine dark:text-foreground">Add a New Section</h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl border-border">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-marine dark:text-foreground">Add Activity</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddActivityModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleAddActivitySubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Activity Name</Label>
                  <Input name="activityName" placeholder="e.g. Visit Eiffel Tower" required />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <select name="category" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="activity">Activity 🎟️</option>
                    <option value="transport">Transport ✈️</option>
                    <option value="stay">Accommodation 🏨</option>
                    <option value="meal">Meal 🍽️</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input name="date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input name="startTime" type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <Input name="costOverride" type="number" step="0.01" placeholder="0.00" />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Activity"}
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

  const countries = Array.from(new Set(cities.map(c => c.country))).filter(Boolean).sort();
  const filteredCities = cities.filter(c => c.country === selectedCountry);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let cityId = selectedCityId;
      
      if (isCustom) {
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
            <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} required className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm">
              <option value="">Select Country...</option>
              {countries.map((c: any) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <select value={selectedCityId} onChange={e => setSelectedCityId(e.target.value)} required disabled={!selectedCountry} className="w-full h-10 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 text-sm">
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
