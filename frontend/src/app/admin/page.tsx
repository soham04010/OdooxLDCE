"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Map, Navigation, Image as ImageIcon, Activity, TrendingUp, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dynamic from "next/dynamic";

import { toast } from "sonner";

const DynamicPieChart = dynamic(() => import("@/components/AdminPieChart"), { ssr: false });
const DynamicBarChart = dynamic(() => import("@/components/AdminBarChart"), { ssr: false });

const MONTHLY_DATA = [
  { name: 'Jan', users: 10, trips: 5 },
  { name: 'Feb', users: 15, trips: 8 },
  { name: 'Mar', users: 20, trips: 15 },
  { name: 'Apr', users: 35, trips: 22 },
  { name: 'May', users: 45, trips: 30 },
  { name: 'Jun', users: 60, trips: 45 },
];
const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats", { credentials: "include" });
        if (!res.ok) {
          toast.error("Access Denied: Admin privileges required.");
          router.push("/dashboard");
          return;
        }
        setStats(await res.json());
      } catch (err) {
        console.error("Admin stats error:", err);
        toast.error("Unable to connect to backend server.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />
      
      <main className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Overview Dashboard</h1>
            <p className="text-muted-foreground mt-1">Platform analytics and user management.</p>
          </div>
          <Button className="rounded-full shadow-sm">
            <TrendingUp className="w-4 h-4 mr-2" /> Download Report
          </Button>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-0 font-semibold">+12%</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h3 className="text-3xl font-bold">{stats.totals.users}</h3>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Map className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-0 font-semibold">+34%</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Trips Planned</p>
              <h3 className="text-3xl font-bold">{stats.totals.trips}</h3>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-0 font-semibold">+8%</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground">Community Posts</p>
              <h3 className="text-3xl font-bold">{stats.totals.posts}</h3>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle>Platform Growth</CardTitle>
              <CardDescription>Monthly new users vs trips created.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MONTHLY_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="users" name="Users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="trips" name="Trips" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 border-0 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle>Content Distribution</CardTitle>
              <CardDescription>Ratio of entities in database.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-[220px] w-full">
                <DynamicPieChart data={PIE_DATA} />
              </div>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#10b981]"/> <span className="text-sm font-medium">Users</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"/> <span className="text-sm font-medium">Trips</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"/> <span className="text-sm font-medium">Posts</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Section via Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6 p-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border dark:border-zinc-800">
            <TabsTrigger value="users" className="px-4 py-2 rounded-md font-medium text-sm data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800">Manage Users</TabsTrigger>
            <TabsTrigger value="cities" className="px-4 py-2 rounded-md font-medium text-sm data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800">Popular Cities</TabsTrigger>
            <TabsTrigger value="activities" className="px-4 py-2 rounded-md font-medium text-sm data-[state=active]:bg-zinc-100 dark:data-[state=active]:bg-zinc-800">Popular Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 outline-none">
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
              <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-lg">Platform Users</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-muted-foreground uppercase bg-zinc-50 dark:bg-zinc-900/50">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4 text-center">Trips</th>
                        <th className="px-6 py-4 text-center">Posts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {stats.users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(u.name)} alt="" className="w-8 h-8 rounded-full shadow-sm" />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="px-2 font-semibold">{u.tripCount}</Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant="secondary" className="px-2 font-semibold">{u.postCount}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cities" className="space-y-4 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="border-b px-6 py-4">
                  <CardTitle className="text-lg">City Popularity Chart</CardTitle>
                </CardHeader>
                <CardContent className="p-6 h-[400px]">
                  <DynamicBarChart data={BAR_DATA.length ? BAR_DATA : [{name: 'No data', visits: 1}]} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="border-b px-6 py-4">
                  <CardTitle className="text-lg">City Data</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-[400px] overflow-y-auto">
                    {stats.popularCities.map((c: any, i: number) => (
                      <div key={c.cityId} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground font-bold w-4">{i + 1}</span>
                          <div className="w-10 h-10 rounded-md bg-zinc-100 flex items-center justify-center overflow-hidden">
                            {c.imageUrl ? <img src={c.imageUrl} className="w-full h-full object-cover" /> : <Navigation className="w-5 h-5 text-zinc-400" />}
                          </div>
                          <span className="font-semibold">{c.name}</span>
                        </div>
                        <Badge variant="secondary">{c.visitCount} trips</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4 outline-none">
            <Card className="border-0 shadow-sm bg-white dark:bg-zinc-900">
              <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-lg">Top Activities Booked</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.popularActivities.map((a: any, i: number) => (
                    <div key={a.activityId} className="flex items-center justify-between p-6 hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-bold text-muted-foreground w-6">{i + 1}</div>
                        <div>
                          <h4 className="font-semibold text-lg">{a.name}</h4>
                          <Badge variant="outline" className="mt-1">{a.type || "General"}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-bold text-sm">{a.bookingCount} bookings</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
