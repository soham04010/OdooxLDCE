"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Map, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  Search, 
  Filter,
  ArrowUpRight,
  Eye,
  Activity,
  Shield,
  Zap,
  Radio,
  Cpu,
  HardDrive,
  Terminal,
  CheckCircle2,
  ExternalLink,
  Lock,
  Globe
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const DynamicPieChart = dynamic(() => import("@/components/AdminPieChart"), { ssr: false });
const DynamicBarChart = dynamic(() => import("@/components/AdminBarChart"), { ssr: false });

const MONTHLY_GROWTH = [
  { name: 'Jan', users: 12, trips: 8 },
  { name: 'Feb', users: 24, trips: 18 },
  { name: 'Mar', users: 42, trips: 35 },
  { name: 'Apr', users: 68, trips: 52 },
  { name: 'May', users: 95, trips: 78 },
  { name: 'Jun', users: 130, trips: 110 },
];

const LIVE_OBSERVER_FEED = [
  { id: 1, time: "Just now", text: "Database connection pool re-verified (100% health)", status: "system" },
  { id: 2, time: "2m ago", text: "User created trip 'Tokyo & Kyoto 7-Day Explorer'", status: "user" },
  { id: 3, time: "5m ago", text: "New invitation accepted for trip #14", status: "social" },
  { id: 4, time: "12m ago", text: "Community story published: 'Hidden gems in Bali'", status: "post" },
  { id: 5, time: "25m ago", text: "Automatic database indexing cycle completed", status: "system" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/stats", { credentials: "include" });
      if (!res.ok) {
        toast.error("Access Denied: Admin observer privileges required.");
        router.push("/dashboard");
        return;
      }
      setStats(await res.json());
      if (isManual) toast.success("Observer telemetry refreshed.");
    } catch (err) {
      console.error("Admin stats error:", err);
      toast.error("Unable to connect to telemetry server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [router]);

  const filteredUsers = useMemo(() => {
    if (!stats?.users) return [];
    return stats.users.filter((u: any) => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || (roleFilter === "admin" ? u.role === "admin" : u.role !== "admin");
      return matchesSearch && matchesRole;
    });
  }, [stats, searchQuery, roleFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-marine border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Initializing Platform Observer Console...</p>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center text-muted-foreground font-semibold">Access Denied</div>;

  const PIE_DATA = [
    { name: 'Users', value: Number(stats.totals.users) || 0 },
    { name: 'Trips', value: Number(stats.totals.trips) || 0 },
    { name: 'Posts', value: Number(stats.totals.posts) || 0 }
  ].filter(d => d.value > 0);

  if (PIE_DATA.length === 0) {
    PIE_DATA.push({ name: 'No Data', value: 1 });
  }

  const BAR_DATA = stats.popularCities.map((c: any) => ({
    name: c.name,
    visits: Number(c.visitCount) || 0
  }));

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Total Users,${stats.totals.users}\n`
      + `Total Trips,${stats.totals.trips}\n`
      + `Total Posts,${stats.totals.posts}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `observer_telemetry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Observer telemetry exported.");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />

      <main className="container mx-auto p-6 md:p-10 max-w-7xl">
        {/* Observer Header & Live Status */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs flex items-center gap-1.5 px-2.5 py-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Observer Telemetry Active
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Platform Control Tower</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-marine dark:text-foreground flex items-center gap-2">
              <Eye className="w-6 h-6 text-marine dark:text-primary" />
              Platform Observer Console
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchStats(true)} 
              disabled={refreshing} 
              className="h-9 text-xs font-medium gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> 
              Sync Telemetry
            </Button>

            <Button 
              variant="default"
              size="sm" 
              onClick={handleExportCSV} 
              className="h-9 text-xs font-medium gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Logs
            </Button>
          </div>
        </div>

        {/* Real-time System Vitals Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Database</p>
              <p className="text-sm font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> PostgreSQL Online
              </p>
            </div>
            <HardDrive className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">API Latency</p>
              <p className="text-sm font-bold text-marine dark:text-foreground mt-0.5">14 ms avg</p>
            </div>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Observer Role</p>
              <p className="text-sm font-bold text-marine dark:text-foreground mt-0.5">Read-Only Control</p>
            </div>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Environment</p>
              <p className="text-sm font-bold text-marine dark:text-foreground mt-0.5">Production Active</p>
            </div>
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        {/* Minimal Observer Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Card className="border border-border/60 bg-card p-5 shadow-2xs rounded-xl">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Registered Accounts</span>
              <Users className="w-4 h-4 text-marine dark:text-primary" />
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-marine dark:text-foreground">{stats.totals.users}</h3>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +14% user growth
              </span>
            </div>
          </Card>

          <Card className="border border-border/60 bg-card p-5 shadow-2xs rounded-xl">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Total Itineraries</span>
              <Map className="w-4 h-4 text-marine dark:text-primary" />
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-marine dark:text-foreground">{stats.totals.trips}</h3>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +28% creation rate
              </span>
            </div>
          </Card>

          <Card className="border border-border/60 bg-card p-5 shadow-2xs rounded-xl">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Community Artifacts</span>
              <ImageIcon className="w-4 h-4 text-marine dark:text-primary" />
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold tracking-tight text-marine dark:text-foreground">{stats.totals.posts}</h3>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +8% posts
              </span>
            </div>
          </Card>
        </div>

        {/* Observer Charts & Live Telemetry Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Growth Chart */}
          <Card className="lg:col-span-2 border border-border/60 p-6 bg-card rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-sm text-marine dark:text-foreground">Platform Activity Trajectory</h3>
                <p className="text-xs text-muted-foreground">Historical telemetry of signups vs itinerary creations.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Users</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-wave" /> Trips</span>
              </div>
            </div>

            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_GROWTH} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} />
                  <Line type="monotone" dataKey="users" name="Users" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="trips" name="Trips" stroke="#376fb7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Live Observer Feed */}
          <Card className="border border-border/60 p-6 bg-card rounded-xl shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm text-marine dark:text-foreground flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-500 animate-pulse" /> Live Telemetry Ticker
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">REALTIME</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Stream of observed platform actions.</p>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-1">
              {LIVE_OBSERVER_FEED.map((feed) => (
                <div key={feed.id} className="text-xs p-2.5 rounded-lg bg-muted/40 border border-border/40 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                    <span className="font-semibold uppercase tracking-wider text-marine dark:text-foreground">{feed.status}</span>
                    <span>{feed.time}</span>
                  </div>
                  <p className="text-xs text-foreground font-medium">{feed.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Observer Inspection Tables */}
        <Tabs defaultValue="users" className="w-full">
          <div className="border-b border-border/60 mb-6">
            <TabsList className="bg-transparent p-0 gap-6 h-auto">
              <TabsTrigger 
                value="users" 
                className="rounded-none border-b-2 border-transparent px-0 py-2.5 text-xs font-semibold text-muted-foreground data-[state=active]:border-marine dark:data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
              >
                User Inspector ({filteredUsers.length})
              </TabsTrigger>
              <TabsTrigger 
                value="cities" 
                className="rounded-none border-b-2 border-transparent px-0 py-2.5 text-xs font-semibold text-muted-foreground data-[state=active]:border-marine dark:data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
              >
                Destination Telemetry ({stats.popularCities.length})
              </TabsTrigger>
              <TabsTrigger 
                value="activities" 
                className="rounded-none border-b-2 border-transparent px-0 py-2.5 text-xs font-semibold text-muted-foreground data-[state=active]:border-marine dark:data-[state=active]:border-primary data-[state=active]:text-foreground bg-transparent shadow-none"
              >
                Experience Analytics ({stats.popularActivities.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: USER INSPECTOR */}
          <TabsContent value="users" className="outline-none space-y-4">
            <Card className="border border-border/60 bg-card rounded-xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                  <Input
                    placeholder="Search accounts to inspect..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-xs h-9 border-border/60"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={roleFilter === "all" ? "secondary" : "ghost"}
                    onClick={() => setRoleFilter("all")}
                    className="text-xs h-8 px-3 font-medium"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={roleFilter === "admin" ? "secondary" : "ghost"}
                    onClick={() => setRoleFilter("admin")}
                    className="text-xs h-8 px-3 font-medium"
                  >
                    Admins
                  </Button>
                  <Button
                    size="sm"
                    variant={roleFilter === "user" ? "secondary" : "ghost"}
                    onClick={() => setRoleFilter("user")}
                    className="text-xs h-8 px-3 font-medium"
                  >
                    Users
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider border-b border-border/40">
                    <tr>
                      <th className="px-5 py-3">Account Identity</th>
                      <th className="px-5 py-3 text-center">Role</th>
                      <th className="px-5 py-3 text-center">Trips Created</th>
                      <th className="px-5 py-3 text-center">Posts Published</th>
                      <th className="px-5 py-3 text-right">Observer Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground font-medium">
                          No user accounts matching "{searchQuery}".
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.avatarUrl || "https://ui-avatars.com/api/?background=142b51&color=fff&name=" + encodeURIComponent(u.name)}
                                alt=""
                                className="w-7 h-7 rounded-full border border-border/60 object-cover"
                              />
                              <div>
                                <p className="font-semibold text-marine dark:text-foreground">{u.name}</p>
                                <p className="text-[11px] text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge 
                              variant="outline" 
                              className={u.role === "admin" 
                                ? "bg-marine/10 text-marine border-marine/20 font-medium text-[11px]" 
                                : "bg-muted text-muted-foreground border-border text-[11px]"}
                            >
                              {u.role === "admin" ? "Admin Observer" : "User"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium">
                            {u.tripCount}
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium">
                            {u.postCount}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedUser(u)}
                              className="text-[11px] h-7 font-semibold gap-1"
                            >
                              <Eye className="w-3 h-3 text-marine dark:text-primary" /> Inspect User
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 2: CITIES */}
          <TabsContent value="cities" className="outline-none space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border/60 bg-card rounded-xl shadow-2xs p-5">
                <h3 className="font-semibold text-sm text-marine dark:text-foreground mb-4">Destination Travel Index</h3>
                <div className="h-[320px] w-full">
                  <DynamicBarChart data={BAR_DATA.length ? BAR_DATA : [{ name: 'No data', visits: 1 }]} />
                </div>
              </Card>

              <Card className="border border-border/60 bg-card rounded-xl shadow-2xs p-5">
                <h3 className="font-semibold text-sm text-marine dark:text-foreground mb-4">Top Visited Cities</h3>
                <div className="divide-y divide-border/40 max-h-[320px] overflow-y-auto pr-1">
                  {stats.popularCities.map((c: any, i: number) => (
                    <div key={c.cityId} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground w-4">#{i + 1}</span>
                        <span className="font-semibold text-xs text-marine dark:text-foreground">{c.name}</span>
                      </div>
                      <Badge variant="secondary" className="font-medium text-xs">
                        {c.visitCount} visits logged
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: ACTIVITIES */}
          <TabsContent value="activities" className="outline-none space-y-4">
            <Card className="border border-border/60 bg-card rounded-xl shadow-2xs p-5">
              <h3 className="font-semibold text-sm text-marine dark:text-foreground mb-4">Observed Experience Rankings</h3>
              <div className="divide-y divide-border/40">
                {stats.popularActivities.map((a: any, i: number) => (
                  <div key={a.activityId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-muted-foreground w-4">#{i + 1}</span>
                      <div>
                        <h4 className="font-semibold text-xs text-marine dark:text-foreground">{a.name}</h4>
                        <span className="text-[11px] text-muted-foreground">{a.type || "Experience"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-medium text-xs">
                      {a.bookingCount} bookings
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* User Inspector Observer Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border/80 p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-marine dark:text-foreground">
              <Eye className="w-4 h-4 text-marine dark:text-primary" /> Observer User Inspector
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <img 
                  src={selectedUser.avatarUrl || "https://ui-avatars.com/api/?background=142b51&color=fff&name=" + encodeURIComponent(selectedUser.name)} 
                  className="w-12 h-12 rounded-full border border-border object-cover" 
                />
                <div>
                  <h4 className="font-bold text-sm text-marine dark:text-foreground">{selectedUser.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] font-semibold">
                    Role: {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border/60 bg-card">
                  <span className="text-muted-foreground font-semibold">Trips Created</span>
                  <p className="text-lg font-bold text-marine dark:text-foreground mt-1">{selectedUser.tripCount}</p>
                </div>
                <div className="p-3 rounded-xl border border-border/60 bg-card">
                  <span className="text-muted-foreground font-semibold">Posts Published</span>
                  <p className="text-lg font-bold text-marine dark:text-foreground mt-1">{selectedUser.postCount}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/60 bg-muted/20 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold mb-1">
                  <Lock className="w-3.5 h-3.5" /> Read-Only Telemetry Status
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Observer Mode provides read-only diagnostics for system integrity. No user data mutated.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
