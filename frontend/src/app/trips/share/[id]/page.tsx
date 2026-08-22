"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Copy, Calendar, MapPin, Globe, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SharedTripPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:5000/api/trips/${id}/public`)
      .then(res => {
        if (!res.ok) throw new Error("Trip not found or is private.");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trips/${id}/clone`, {
        method: "POST",
        credentials: "include" // Must be logged in to clone!
      });
      if (res.ok) {
        const json = await res.json();
        alert("Trip cloned successfully to your account!");
        router.push(`/trips/${json.tripId}`);
      } else {
        const errJson = await res.json();
        if (res.status === 401) {
          alert("You must be logged in to clone this trip!");
          router.push("/login");
        } else {
          alert(errJson.error || "Failed to clone trip.");
        }
      }
    } catch (err) {
      alert("Error cloning trip. Please try logging in first.");
    } finally {
      setCloning(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[70vh] text-center">
          <Lock className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-3xl font-black mb-2">Private or Missing Trip</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans pb-20">
      <Navbar />

      <div className="relative w-full h-[400px] md:h-[500px]">
        {data.trip.coverImage ? (
           <img src={data.trip.coverImage} className="w-full h-full object-cover" alt="Cover" />
        ) : (
           <div className="w-full h-full bg-primary/10 flex items-center justify-center">
             <Globe className="w-24 h-24 text-primary/30" />
           </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 container mx-auto text-white flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <Badge className="bg-primary hover:bg-primary border-0 mb-4 px-4 py-1 text-xs tracking-widest font-black uppercase shadow-lg shadow-primary/20">
              Community Itinerary
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2">{data.trip.name}</h1>
            <p className="text-xl text-zinc-300 font-medium flex items-center gap-2">
              <Calendar className="w-5 h-5" /> 
              {new Date(data.trip.startDate).toLocaleDateString()} - {new Date(data.trip.endDate).toLocaleDateString()}
            </p>
          </div>
          <Button size="lg" className="rounded-full shadow-2xl font-bold px-8 text-lg hover:scale-105 transition-transform" onClick={handleClone} disabled={cloning}>
            {cloning ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Cloning...</> : <><Copy className="w-5 h-5 mr-2" /> Clone to My Account</>}
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
           <h3 className="text-xl font-bold mb-4">About this trip</h3>
           <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">{data.trip.description || "No description provided for this trip."}</p>
        </div>

        <h3 className="text-3xl font-black mb-8 flex items-center gap-3"><MapPin className="text-primary w-8 h-8" /> Route & Stops</h3>
        
        {data.stops.length === 0 ? (
          <p className="text-muted-foreground italic">No stops added yet.</p>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-300 dark:before:via-zinc-700 before:to-transparent">
            {data.stops.map((stop: any, idx: number) => {
              const stopActs = data.activities.filter((a: any) => a.stopId === stop.id);
              
              return (
                <div key={stop.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-black z-10">
                    {idx + 1}
                  </div>
                  
                  <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white dark:bg-zinc-900 shadow-lg border-0 rounded-3xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-2xl font-bold">Stop {idx + 1}</h4>
                            <p className="text-sm font-medium text-muted-foreground mt-1">
                              {new Date(stop.startDate).toLocaleDateString()} - {new Date(stop.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mt-6">
                          <h5 className="font-bold text-sm uppercase tracking-wider text-zinc-500">Planned Activities</h5>
                          {stopActs.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No activities planned.</p>
                          ) : (
                            stopActs.map((act: any) => (
                              <div key={act.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Activity ID: {act.activityId.substring(0, 8)}...</p>
                                  <p className="text-xs text-muted-foreground">{new Date(act.plannedDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
