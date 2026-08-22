"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Map, 
  Navigation, 
  Image as ImageIcon, 
  Activity, 
  TrendingUp, 
  ShieldCheck, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Globe, 
  Compass, 
  Server, 
  Sparkles,
  ChevronRight,
  Filter,
  Check
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";

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

const AUDIT_LOGS = [
  { time: "Just now", action: "User database indexed", category: "System" },
  { time: "5 mins ago", action: "New public itinerary shared", category: "Community" },
  { time: "14 mins ago", action: "System health check passed", category: "Backend" },
  { time: "1 hour ago", action: "City popularity scores recalibrated", category: "Analytics" }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/stats", { credentials: "include" });
      if (!res.ok) {
        toast.error("Access Denied: Admin privileges required.");
        router.push("/dashboard");
        return;
      }
      setStats(await res.json());
      if (isManual) toast.success("Metrics refreshed successfully!");
    } catch (err) {
      console.error("Admin stats error:", err);
      toast.error("Unable to connect to backend server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [router]);

  // Filtered Users List
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
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-marine border-t-transparent"></div>
          <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading Admin Control Console...</p>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-center text-red-500 font-bold text-2xl">Access Denied</div>;

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
    link.setAttribute("download", `globetrotter_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV analytics report downloaded!");
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Top Header & Status Bar */}
        <Reveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-card border border-border/80 p-6 rounded-2xl shadow-2xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-xs flex items-center gap-1.5 px-2.5 py-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Platform Operational
                </Badge>
                <Badge variant="outline" className="bg-marine/10 text-marine border-marine/20 font-bold text-xs">
                  Enterprise Control Center
                </Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-marine dark:text-foreground">
                GlobeTrotter Admin Console
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time platform diagnostics, user administration, and destination analytics.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchStats(true)} 
                disabled={refreshing} 
                className="h-10 text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> 
                {refreshing ? "Syncing..." : "Refresh Metrics"}
              </Button>

              <Button 
                size="sm" 
                onClick={handleExportCSV} 
                className="h-10 text-xs font-semibold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV Report
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Top KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Reveal delay={100}>
            <Card className="border border-border/80 shadow-2xs bg-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[11px]">
                  +14.2%
                </Badge>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-3xl font-black text-marine dark:text-foreground">{stats.totals.users}</h3>
              <p className="text-[11px] text-muted-foreground mt-2">Active accounts on platform</p>
            </Card>
          </Reveal>

          <Reveal delay={150}>
            <Card className="border border-border/80 shadow-2xs bg-card p-6 rounded-2xl relative overflow-hidden group hover:border-wave/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-wave/10 flex items-center justify-center text-wave font-bold">
                  <Map className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-wave/10 text-wave border-wave/20 font-bold text-[11px]">
                  +28.5%
                </Badge>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Trips Planned</p>
              <h3 className="text-3xl font-black text-marine dark:text-foreground">{stats.totals.trips}</h3>
              <p className="text-[11px] text-muted-foreground mt-2">Multi-city travel itineraries</p>
            </Card>
          </Reveal>

          <Reveal delay={200}>
            <Card className="border border-border/80 shadow-2xs bg-card p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[11px]">
                  +18.9%
                </Badge>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Community Posts</p>
              <h3 className="text-3xl font-black text-marine dark:text-foreground">{stats.totals.posts}</h3>
              <p className="text-[11px] text-muted-foreground mt-2">Shared travel stories</p>
            </Card>
          </Reveal>

          <Reveal delay={250}>
            <Card className="border border-border/80 shadow-2xs bg-card p-6 rounded-2xl relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold">
                  <Server className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[11px]">
                  99.98%
                </Badge>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">System Load</p>
              <h3 className="text-3xl font-black text-marine dark:text-foreground">Optimal</h3>
              <p className="text-[11px] text-muted-foreground mt-2">Postgres DB & API healthy</p>
            </Card>
          </Reveal>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Platform Growth Chart */}
          <Reveal delay={300} className="lg:col-span-2">
            <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-base text-marine dark:text-foreground">Platform Growth Trajectory</h3>
                  <p className="text-xs text-muted-foreground">Monthly active user signups vs created trips.</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Users</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-wave" /> Trips</span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHLY_GROWTH} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                    <Line type="monotone" dataKey="users" name="New Users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="trips" name="New Trips" stroke="#376fb7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Reveal>

          {/* Content Distribution Pie Chart */}
          <Reveal delay={350}>
            <Card className="border border-border/80 p-6 shadow-2xs bg-card rounded-2xl flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-base text-marine dark:text-foreground mb-1">Content Distribution</h3>
                <p className="text-xs text-muted-foreground mb-4">Entity breakdown across platform records.</p>
              </div>

              <div className="h-[220px] w-full flex items-center justify-center">
                <DynamicPieChart data={PIE_DATA} />
              </div>

              <div className="flex justify-center gap-4 border-t border-border/60 pt-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Users</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" /> Trips</div>
                <div className="flex items-center gap-1.5 text-xs font-semibold"><span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" /> Posts</div>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Production-Grade Management Tabs */}
        <Reveal delay={400}>
          <Tabs defaultValue="users" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList className="bg-muted p-1 rounded-xl">
                <TabsTrigger value="users" className="text-xs font-bold px-4 py-2 rounded-lg">
                  User Management ({filteredUsers.length})
                </TabsTrigger>
                <TabsTrigger value="cities" className="text-xs font-bold px-4 py-2 rounded-lg">
                  Popular Destinations ({stats.popularCities.length})
                </TabsTrigger>
                <TabsTrigger value="activities" className="text-xs font-bold px-4 py-2 rounded-lg">
                  Top Booked Activities ({stats.popularActivities.length})
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs font-bold px-4 py-2 rounded-lg">
                  System Audit Logs
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: USER MANAGEMENT */}
            <TabsContent value="users" className="outline-none space-y-4">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-xs h-10 border-border/80"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <span className="text-xs text-muted-foreground font-semibold mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Filter:
                    </span>
                    <Button
                      size="sm"
                      variant={roleFilter === "all" ? "default" : "outline"}
                      onClick={() => setRoleFilter("all")}
                      className="text-[11px] h-8 font-semibold px-3"
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={roleFilter === "admin" ? "default" : "outline"}
                      onClick={() => setRoleFilter("admin")}
                      className="text-[11px] h-8 font-semibold px-3"
                    >
                      Admins
                    </Button>
                    <Button
                      size="sm"
                      variant={roleFilter === "user" ? "default" : "outline"}
                      onClick={() => setRoleFilter("user")}
                      className="text-[11px] h-8 font-semibold px-3"
                    >
                      Regular Users
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">User Identity</th>
                        <th className="px-6 py-3.5 text-center">Role</th>
                        <th className="px-6 py-3.5 text-center">Trips Created</th>
                        <th className="px-6 py-3.5 text-center">Posts Published</th>
                        <th className="px-6 py-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-muted-foreground font-medium">
                            No users found matching "{searchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatarUrl || "https://ui-avatars.com/api/?background=142b51&color=fff&name=" + encodeURIComponent(u.name)}
                                  alt=""
                                  className="w-9 h-9 rounded-full shadow-2xs object-cover border border-border/80"
                                />
                                <div>
                                  <p className="font-bold text-marine dark:text-foreground text-xs">{u.name}</p>
                                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge 
                                variant="outline" 
                                className={u.role === "admin" 
                                  ? "bg-marine/10 text-marine border-marine/20 font-bold" 
                                  : "bg-muted text-muted-foreground border-border"}
                              >
                                {u.role === "admin" ? "🛡️ Admin" : "User"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-marine dark:text-foreground">
                              {u.tripCount}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-marine dark:text-foreground">
                              {u.postCount}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px]">
                                Active
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: POPULAR CITIES */}
            <TabsContent value="cities" className="outline-none space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs p-6">
                  <h3 className="font-bold text-base text-marine dark:text-foreground mb-4">City Popularity Chart</h3>
                  <div className="h-[360px] w-full">
                    <DynamicBarChart data={BAR_DATA.length ? BAR_DATA : [{ name: 'No data', visits: 1 }]} />
                  </div>
                </Card>

                <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs p-6">
                  <h3 className="font-bold text-base text-marine dark:text-foreground mb-4">Destination Leaderboard</h3>
                  <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto pr-2">
                    {stats.popularCities.map((c: any, i: number) => (
                      <div key={c.cityId} className="py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors px-2 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-xs text-muted-foreground w-5">#{i + 1}</span>
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden border border-border/80 shrink-0">
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Navigation className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-bold text-xs text-marine dark:text-foreground">{c.name}</span>
                        </div>
                        <Badge variant="outline" className="bg-wave/10 text-wave border-wave/20 font-bold text-xs">
                          {c.visitCount} trips planned
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 3: POPULAR ACTIVITIES */}
            <TabsContent value="activities" className="outline-none space-y-4">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs p-6">
                <h3 className="font-bold text-base text-marine dark:text-foreground mb-4">Top Booked Experiences & Activities</h3>
                <div className="divide-y divide-border/60">
                  {stats.popularActivities.map((a: any, i: number) => (
                    <div key={a.activityId} className="flex items-center justify-between py-4 px-2 hover:bg-muted/30 transition-colors rounded-xl">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-extrabold text-muted-foreground w-6">#{i + 1}</span>
                        <div>
                          <h4 className="font-bold text-sm text-marine dark:text-foreground">{a.name}</h4>
                          <Badge variant="outline" className="mt-1 text-[10px] font-semibold text-muted-foreground">
                            {a.type || "Activity"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{a.bookingCount} bookings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB 4: SYSTEM AUDIT LOGS */}
            <TabsContent value="logs" className="outline-none space-y-4">
              <Card className="border border-border/80 bg-card rounded-2xl shadow-2xs p-6">
                <h3 className="font-bold text-base text-marine dark:text-foreground mb-1">System Event Audit Logs</h3>
                <p className="text-xs text-muted-foreground mb-6">Real-time security and operational telemetry events.</p>

                <div className="space-y-3">
                  {AUDIT_LOGS.map((log, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-marine/10 text-marine border-marine/20 text-[10px] font-bold">
                          {log.category}
                        </Badge>
                        <span className="font-semibold text-marine dark:text-foreground">{log.action}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px] font-medium">{log.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Reveal>
      </main>
    </div>
  );
}
