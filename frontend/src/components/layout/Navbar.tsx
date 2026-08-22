"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useEffect, useState } from "react";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUser(u);
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
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4 max-w-7xl">
        <div className="flex min-w-0 flex-1 items-center">
          <Link href="/dashboard" className="mr-6 shrink-0" aria-label="Dashboard">
            <Logo size="sm" />
          </Link>

          <nav className="no-scrollbar flex min-w-0 items-center gap-5 overflow-x-auto whitespace-nowrap">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors ${pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/explore" 
              className={`text-sm font-medium transition-colors ${pathname === "/explore" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}`}
            >
              Explore & Discover
            </Link>
            <Link 
              href="/trips" 
              className={`text-sm font-medium transition-colors ${pathname === "/trips" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}`}
            >
              My Trips
            </Link>
            <Link 
              href="/community" 
              className={`text-sm font-medium transition-colors ${pathname === "/community" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}`}
            >
              Community
            </Link>
            <Link 
              href="/calendar" 
              className={`text-sm font-medium transition-colors ${pathname === "/calendar" ? "text-primary font-bold" : "text-muted-foreground hover:text-primary"}`}
            >
              Calendar
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className={`rounded-full px-3 py-1 text-sm font-bold transition-colors border ${
                  pathname === "/admin" 
                    ? "bg-marine text-white border-marine shadow-2xs" 
                    : "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => router.push("/inbox")} title="Inbox & Invitations">
            <MessageSquare className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            <span className="sr-only">Inbox</span>
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
