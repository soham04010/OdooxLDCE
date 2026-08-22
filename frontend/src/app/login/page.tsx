"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Command } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch(`http://localhost:5000/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include"
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Authentication failed");

      localStorage.setItem("user", JSON.stringify(json.user));
      
      if (json.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      
      <div className="z-10 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Command className="h-6 w-6" />
            </div>
            Globe<span className="text-primary">Trotter</span>
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
            <CardDescription>Enter your email and password to sign in</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid gap-5">
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md text-center font-medium">
                    {error}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" name="email" placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" required className="h-11" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" required className="h-11" />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11 text-base mt-2">
                  {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline underline-offset-4">
                Sign up for free
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
