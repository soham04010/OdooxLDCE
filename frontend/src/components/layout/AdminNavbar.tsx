"use client";

import Link from "next/link";
import { User, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export function AdminNavbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {}
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
          <Badge variant="outline" className="bg-marine/10 text-marine dark:text-primary border-marine/20 font-semibold text-xs px-2.5 py-0.5">
            Admin Console
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/dashboard")}
            className="text-xs font-medium gap-1.5 h-9 mr-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </Button>

          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-muted/60 transition-colors border border-border/80 group"
            title="View Profile"
          >
            <div className="w-7 h-7 rounded-full bg-marine text-white flex items-center justify-center font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}</span>
              )}
            </div>
            <span className="text-xs font-semibold text-marine dark:text-foreground max-w-[100px] truncate hidden sm:inline-block">
              {user?.name || "Profile"}
            </span>
          </button>

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
