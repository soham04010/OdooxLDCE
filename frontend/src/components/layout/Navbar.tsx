"use client";

import Link from "next/link";
import { Command, User, Map, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

export function Navbar() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === "admin") setIsAdmin(true);
      } catch (e) {}
    }
  }, []);
  
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", { method: "POST" });
    } catch (e) {}
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 mx-auto">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Command className="h-6 w-6" />
            <span className="font-bold sm:inline-block">
              Globe<span className="text-primary">Trotter</span>
            </span>
          </Link>
          <div className="flex gap-6 items-center">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/discover" className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground">
            Discover
          </Link>
          <Link href="/trips" className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground">
            My Trips
          </Link>
          <Link href="/community" className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground">
            Community
          </Link>
          <Link href="/calendar" className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground">
            Calendar
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm font-bold hover:text-primary transition-colors text-primary border border-primary/20 bg-primary/10 px-3 py-1 rounded-full">
              Admin Panel
            </Link>
          )}
        </div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
