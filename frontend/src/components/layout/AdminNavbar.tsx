"use client";

import Link from "next/link";
import { User, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

export function AdminNavbar() {
  const router = useRouter();

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
            className="text-xs font-medium gap-1.5 h-9"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to App
          </Button>

          <Button variant="ghost" size="icon" onClick={() => router.push("/profile")} title="Profile">
            <User className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </header>
  );
}
