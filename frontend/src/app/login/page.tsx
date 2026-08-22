"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthArt } from "@/components/auth-art";

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
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Authentication failed");

      if (json.token) {
        localStorage.setItem("token", json.token);
      } else {
        localStorage.removeItem("token");
      }
      localStorage.setItem("user", JSON.stringify(json.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Mobile stacks: logo, artwork, form, footer.
    // From lg the artwork moves into its own column beside the form.
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-6 py-10 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="flex justify-center lg:justify-start"
          aria-label="Good Weekend Co. home"
        >
          <Logo size="sm" />
        </Link>

        {/* artwork — mobile only, sits above the form */}
        <div className="flex justify-center pt-8 lg:hidden">
          <AuthArt className="max-w-[17rem]" photoSrc="/traveller.png" />
        </div>

        <div className="flex flex-1 items-center justify-center lg:justify-start">
          <form onSubmit={handleLogin} className="w-full max-w-sm py-10">
            <div className="grid gap-5">
              <div className="space-y-2 text-center lg:text-left">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and password to sign in
                </p>
              </div>

              {error && (
                <div
                  className="rounded-md bg-destructive/10 p-3 text-center text-sm font-medium text-destructive"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-2 h-12 w-full text-base font-bold uppercase tracking-wide"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Sign in
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link
                  href="/register"
                  className="font-medium text-wave underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground lg:text-left">
          © {new Date().getFullYear()} Good Weekend Co. All rights reserved.
        </p>
      </div>

      {/* artwork — desktop only, its own column */}
      <div className="hidden items-center justify-center bg-muted p-12 lg:flex">
        <div className="flex w-full max-w-md items-center justify-center overflow-hidden rounded-2xl bg-[var(--cream)] shadow-sm">
          <AuthArt photoSrc="/traveller.png" />
        </div>
      </div>
    </div>
  );
}
