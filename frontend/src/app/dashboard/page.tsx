"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    // Check for auth token (temporary local storage approach)
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  if (!user) return null; // Avoid hydration mismatch or flash while redirecting

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <h1 className="text-4xl font-bold mb-8">Welcome back, {user.name}!</h1>
      <p className="text-lg text-muted-foreground mb-8">You are successfully logged in with {user.email}.</p>
      <Button onClick={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }}>
        Sign out
      </Button>
    </main>
  );
}
