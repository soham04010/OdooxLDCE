
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

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
          router.push("/auth");
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
  
  // Get days to render (pad beginning with empty days if month doesnt start on Sunday)
  const startDate = monthStart;
  const startDay = startDate.getDay(); // 0-6 (Sun-Sat)
  
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const emptyDaysPrefix = Array.from({ length: startDay }, (_, i) => i);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Determine if a day falls within a trip
  const getTripsForDay = (day: Date) => {
    return trips.filter(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      // Reset hours to handle timezone matching roughly
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      day.setHours(12,0,0,0); 
      return isWithinInterval(day, { start, end });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Calendar View Screen (Screen 11)</h1>
        
        <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-bold">{format(currentDate, "MMMM yyyy")}</h2>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b bg-muted/20">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
              <div key={day} className="p-3 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-muted/10 min-h-[500px]">
            {emptyDaysPrefix.map((_, i) => (
              <div key={`empty-${i}`} className="border-r border-b min-h-[100px] bg-muted/5 p-2"></div>
            ))}
            
            {daysInMonth.map(day => {
              const dayTrips = getTripsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();
              
              return (
                <div key={day.toString()} className="border-r border-b min-h-[100px] p-2 relative bg-card">
                  <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-card-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {dayTrips.map(trip => (
                      <div 
                        key={trip.id} 
                        onClick={() => router.push(`/trips/${trip.id}`)}
                        className="text-xs bg-muted border p-1 rounded font-medium cursor-pointer hover:bg-primary/10 truncate"
                        title={trip.name}
                      >
                        {trip.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
