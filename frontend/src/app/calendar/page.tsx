"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/trips", { credentials: "include" });
        if (res.ok) {
          setTrips(await res.json());
        } else if (res.status === 401) {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [router]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDay = monthStart.getDay();
  
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const emptyDaysPrefix = Array.from({ length: startDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getTripsForDay = (day: Date) => {
    return trips.filter(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      const current = new Date(day);
      current.setHours(12,0,0,0); 
      return isWithinInterval(current, { start, end });
    });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-marine dark:text-foreground">Personal Trip Calendar</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Overview of your upcoming and past travel schedules.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
        
        {loading ? (
          <Skeleton className="w-full h-[550px] rounded-xl" />
        ) : (
          <div className="border border-border/80 rounded-xl shadow-sm bg-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/20">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-bold text-marine dark:text-foreground">{format(currentDate, "MMMM yyyy")}</h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b bg-muted/40">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-muted/10 min-h-[480px]">
              {emptyDaysPrefix.map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b min-h-[95px] bg-muted/5 p-2"></div>
              ))}
              
              {daysInMonth.map(day => {
                const dayTrips = getTripsForDay(day);
                const isToday = new Date().toDateString() === day.toDateString();
                
                return (
                  <div key={day.toString()} className="border-r border-b min-h-[95px] p-2 relative bg-card">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-wave text-white" : "text-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    
                    <div className="mt-1.5 space-y-1">
                      {dayTrips.map(trip => (
                        <div 
                          key={trip.id} 
                          onClick={() => router.push(`/trips/${trip.id}`)}
                          className="text-xs bg-wave/10 text-marine dark:text-wave border border-wave/20 p-1.5 rounded font-semibold cursor-pointer hover:bg-wave/20 transition-colors truncate flex items-center gap-1"
                          title={trip.name}
                        >
                          <MapPin className="w-3 h-3 shrink-0 text-wave" />
                          <span className="truncate">{trip.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
