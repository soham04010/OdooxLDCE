"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, X, Loader2, Calendar, PieChart as PieIcon, List, Share2, Copy, MapPin, Plane, Hotel, Utensils, Compass, Users, UserPlus, Receipt, DollarSign, CheckCircle2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import dynamic from "next/dynamic";

const DynamicBudgetChart = dynamic(() => import("@/components/TripBudgetChart"), { ssr: false });

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
  
  const [data, setData] = useState<{ trip: any, stops: any[], members?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "analytics" | "split">("list");
  
  // Modals state
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  
  // Dependencies data
  const [cities, setCities] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [activeStopId, setActiveStopId] = useState<string | null>(null);
  const [activeCityId, setActiveCityId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [copying, setCopying] = useState(false);

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
        credentials: "include"
      });
      if (res.ok) {
        toast.success(`${inviteName} added to trip!`);
        setInviteName("");
        setInviteEmail("");
        setIsInviteModalOpen(false);
        fetchTrip();
      } else {
        toast.error("Failed to add trip member");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error connecting to backend");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${tripId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (res.ok) {
        toast.success(`${memberName} removed from trip`);
        fetchTrip();
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    const paidByMemberName = formData.get("paidByMemberName") as string;

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
          paidByMemberName: paidByMemberName || undefined,
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

  // Members & Split Calculation
  const hostName = "You (Host)";
  const memberList = [
    { name: hostName, role: "owner" },
    ...(data?.members || []).map((m: any) => ({ id: m.id, name: m.name, email: m.email, role: m.role }))
  ];
  const memberCount = Math.max(1, memberList.length);
  const perPersonShare = totalSpend / memberCount;

  const paidByMap: Record<string, number> = {};
  memberList.forEach(m => paidByMap[m.name] = 0);

  data?.stops.forEach((stopItem: any) => {
    stopItem.activities.forEach((act: any) => {
      const cost = Number(act.item.costOverride || act.activity.cost || 0);
      const payer = act.item.paidByMemberName || hostName;
      paidByMap[payer] = (paidByMap[payer] || 0) + cost;
    });
  });

  const memberBalances = memberList.map(m => {
    const paid = paidByMap[m.name] || 0;
    const balance = paid - perPersonShare;
    return { ...m, paid, share: perPersonShare, balance };
  });

  const debtors = memberBalances.filter(m => m.balance < -0.01).map(m => ({ ...m, amount: Math.abs(m.balance) }));
  const creditors = memberBalances.filter(m => m.balance > 0.01).map(m => ({ ...m, amount: m.balance }));

  const settlements: { from: string; to: string; amount: number }[] = [];
  let dIdx = 0, cIdx = 0;
  while (dIdx < debtors.length && cIdx < creditors.length) {
    const transfer = Math.min(debtors[dIdx].amount, creditors[cIdx].amount);
    if (transfer > 0.01) {
      settlements.push({ from: debtors[dIdx].name, to: creditors[cIdx].name, amount: transfer });
    }
    debtors[dIdx].amount -= transfer;
    creditors[cIdx].amount -= transfer;
    if (debtors[dIdx].amount < 0.01) dIdx++;
    if (creditors[cIdx].amount < 0.01) cIdx++;
  }

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
            <div className="flex flex-wrap items-center gap-3">
              {data.trip.isPublic && (
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/trips/share/${tripId}`);
                  toast.success("Public share link copied to clipboard!");
                }}>
                  <Share2 className="w-4 h-4 mr-2" /> Share Link
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(true)} className="font-semibold text-xs gap-1.5">
                <UserPlus className="w-4 h-4 text-wave" />
                Invite Friends
              </Button>
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
            <div className="flex flex-wrap justify-between items-center border-b pb-4 gap-4">
              <div className="flex flex-wrap bg-muted p-1 rounded-lg gap-1">
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
                <Button 
                  variant={viewMode === "split" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("split")}
                  className="text-xs gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> Trip Split & Friends
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsInviteModalOpen(true)} className="gap-1.5 text-xs font-semibold">
                  <UserPlus className="w-3.5 h-3.5" /> Invite Friend
                </Button>
                <Button size="sm" onClick={handleAddStopClick} className="gap-1.5 text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" /> Add Section
                </Button>
              </div>
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
                <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl">
                  <div className="mb-4">
                    <h3 className="font-bold text-base text-marine dark:text-foreground">Cost Breakdown by Category</h3>
                    <p className="text-xs text-muted-foreground">Expenditure grouped by activity & stay types.</p>
                  </div>

                  {pieChartData.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-16 text-center border border-dashed rounded-xl">
                      No activities added yet. Add activities to see breakdown.
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={pieChartData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={55}
                            outerRadius={85} 
                            paddingAngle={4}
                          >
                            {pieChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${mainCurrency}${Number(value).toFixed(2)}`, "Spent"]}
                            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", fontWeight: 600 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>

                <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-base text-marine dark:text-foreground">Budget vs Spent per Section</h3>
                      <p className="text-xs text-muted-foreground">Comparative breakdown per destination stop.</p>
                    </div>
                  </div>

                  {stopBudgetData.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-16 text-center border border-dashed rounded-xl">
                      No section budget data available.
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stopBudgetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: "#64748b", fontSize: 12 }} 
                            tickFormatter={(v) => `${mainCurrency}${v}`} 
                          />
                          <Tooltip 
                            formatter={(value: any) => [`${mainCurrency}${Number(value).toFixed(2)}`, ""]}
                            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px", fontWeight: 600 }} />
                          <Bar dataKey="Budget" name="Planned Budget" fill="#142b51" radius={[6, 6, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="Spent" name="Actual Spent" fill="#376fb7" radius={[6, 6, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* TAB 4: TRIP SPLIT & FRIENDS VIEW */}
            {viewMode === "split" && (
              <div className="space-y-6">
                {/* Header Card */}
                <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-5 h-5 text-wave" />
                        <h3 className="font-bold text-lg text-marine dark:text-foreground">
                          Trip Friends & Expense Splitter
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Invite friends, track who paid for each activity, and calculate equal settlements.
                      </p>
                    </div>

                    <Button size="sm" onClick={() => setIsInviteModalOpen(true)} className="gap-1.5 font-semibold text-xs h-9">
                      <UserPlus className="w-3.5 h-3.5" /> Invite Friend to Trip
                    </Button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Trip Expenses</p>
                      <p className="text-2xl font-bold text-marine dark:text-foreground">{mainCurrency}{totalSpend.toFixed(2)}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Group Size</p>
                      <p className="text-2xl font-bold text-marine dark:text-foreground">{memberCount} Member{memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-wave/10 border border-wave/20">
                      <p className="text-[11px] font-semibold text-wave uppercase tracking-wider mb-1">Equal Share / Person</p>
                      <p className="text-2xl font-bold text-wave">{mainCurrency}{perPersonShare.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>

                {/* Members & Balances Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Member Spending Table */}
                  <Card className="lg:col-span-2 border border-border/80 p-6 shadow-2xs bg-card rounded-2xl">
                    <h4 className="font-bold text-base text-marine dark:text-foreground mb-4">
                      Member Balances & Spending
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                          <tr>
                            <th className="p-3 rounded-l-lg">Member</th>
                            <th className="p-3 text-right">Paid</th>
                            <th className="p-3 text-right">Fair Share</th>
                            <th className="p-3 text-right rounded-r-lg">Net Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {memberBalances.map((mb, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-semibold text-marine dark:text-foreground">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-marine text-white flex items-center justify-center font-bold text-[11px]">
                                      {mb.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{mb.name} {mb.role === "owner" ? "(Host)" : ""}</span>
                                  </div>
                                  {(mb as any).id && (
                                    <button
                                      onClick={() => handleRemoveMember((mb as any).id, mb.name)}
                                      className="text-muted-foreground hover:text-destructive p-1"
                                      title="Remove member"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right font-medium">{mainCurrency}{mb.paid.toFixed(2)}</td>
                              <td className="p-3 text-right font-medium text-muted-foreground">{mainCurrency}{mb.share.toFixed(2)}</td>
                              <td className="p-3 text-right font-bold">
                                {mb.balance > 0.01 ? (
                                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[11px]">
                                    Gets back +{mainCurrency}{mb.balance.toFixed(2)}
                                  </Badge>
                                ) : mb.balance < -0.01 ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-bold text-[11px]">
                                    Owes -{mainCurrency}{Math.abs(mb.balance).toFixed(2)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-bold text-[11px]">
                                    Settled up
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Right Column: Settlement Directions */}
                  <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-base text-marine dark:text-foreground mb-1 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-500" /> Payment Settlements
                      </h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        Automated minimal transactions to balance the trip account.
                      </p>

                      {settlements.length === 0 ? (
                        <div className="p-6 text-center border border-dashed rounded-xl bg-emerald-500/5 border-emerald-500/20">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">All Settled Up!</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Everyone has paid their exact fair share.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {settlements.map((st, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-marine dark:text-foreground">{st.from}</span>
                                <span className="text-muted-foreground"> pays </span>
                                <span className="font-bold text-marine dark:text-foreground">{st.to}</span>
                              </div>
                              <span className="font-bold text-destructive text-sm">{mainCurrency}{st.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full mt-6 text-xs font-semibold"
                      variant="outline"
                      onClick={() => toast.success("Payment reminders sent to trip members!")}
                    >
                      Settle Up / Send Reminders
                    </Button>
                  </Card>
                </div>
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

                <div className="space-y-2">
                  <Label>Who Paid for this?</Label>
                  <select name="paidByMemberName" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-sm">
                    <option value="">You (Host)</option>
                    {(data?.members || []).map((m: any) => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={formLoading}>
                  {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Activity"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Friend Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md shadow-xl border-border">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-marine dark:text-foreground flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-wave" /> Invite Friend to Trip
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsInviteModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CardContent className="p-4">
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label>Friend's Name</Label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Alice or Bob"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Friend's Email (Optional)</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="alice@example.com"
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={inviting || !inviteName.trim()}>
                  {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Add Friend"}
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
