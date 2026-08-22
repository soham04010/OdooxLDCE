"use client";

import Link from "next/link";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
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
      } catch {
        // Ignore invalid stored user data.
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout API failures and continue with local cleanup.
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/dashboard" className="mr-6 shrink-0" aria-label="Dashboard">
            <Logo size="sm" />
          </Link>

          <nav className="flex min-w-0 items-center gap-5 overflow-x-auto whitespace-nowrap pb-1 pt-1">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/explore" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Explore & Discover
            </Link>
            <Link href="/trips" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              My Trips
            </Link>
            <Link href="/community" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Community
            </Link>
            <Link href="/calendar" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Calendar
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-bold text-primary transition-colors hover:text-primary"
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center space-x-2">
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
