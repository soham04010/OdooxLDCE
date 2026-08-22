"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Calendar,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  User as UserIcon,
} from "lucide-react";

import { toast } from "sonner";
import { ImageCarousel } from "@/components/community/ImageCarousel";
import { PostModal } from "@/components/community/PostModal";
import { Navbar } from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRange } from "@/lib/sample-data";
import { cn } from "@/lib/utils";
import { getUserPreferences, saveUserPreferences, PERSONA_LABELS, TravelPersona } from "@/lib/personalization";

type Profile = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  avatarUrl?: string | null;
};

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  coverPhotoUrl?: string | null;
  stopCount?: number;
};

type UserPost = {
  post: {
    id: string;
    title: string;
    content?: string | null;
    imageUrls?: string[] | null;
    createdAt: string;
  };
  likesCount?: number;
  commentsCount?: number;
};

type LocalProfileDetails = Pick<Profile, "phone" | "city" | "country">;

const EMPTY_PROFILE: Profile = {
  name: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  avatarUrl: null,
};

const PROFILE_DETAILS_KEY = "profileDetails";

function readLocalDetails(): Partial<LocalProfileDetails> {
  const stored = localStorage.getItem(PROFILE_DETAILS_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored) as Partial<LocalProfileDetails>;
  } catch {
    localStorage.removeItem(PROFILE_DETAILS_KEY);
    return {};
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Profile>(EMPTY_PROFILE);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const [prefs, setPrefs] = useState(getUserPreferences());

  const handlePersonaChange = (persona: TravelPersona) => {
    const updated = saveUserPreferences({ persona });
    setPrefs(updated);
    toast.success(`Travel persona updated to ${PERSONA_LABELS[persona].label}!`);
  };

  const handleCurrencyChange = (currency: string) => {
    const updated = saveUserPreferences({ currency });
    setPrefs(updated);
    toast.success(`Preferred currency updated to ${currency}!`);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [userResponse, tripsResponse, postsResponse] = await Promise.all([
          fetch("http://localhost:5000/api/auth/me", {
            credentials: "include",
          }),
          fetch("http://localhost:5000/api/trips", {
            credentials: "include",
          }),
          fetch("http://localhost:5000/api/users/me/posts", {
            credentials: "include",
          }),
        ]);

        if (userResponse.status === 401) {
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!userResponse.ok) {
          throw new Error("Could not load your profile.");
        }

        const userData = (await userResponse.json()) as {
          user: Partial<Profile> & Pick<Profile, "name" | "email">;
        };
        const serverProfile: Profile = {
          ...EMPTY_PROFILE,
          ...userData.user,
        };
        const mergedProfile: Profile = {
          ...serverProfile,
          ...readLocalDetails(),
        };

        const tripsData = tripsResponse.ok
          ? ((await tripsResponse.json()) as Trip[])
          : [];
        const postsData = postsResponse.ok
          ? ((await postsResponse.json()) as UserPost[])
          : [];

        if (!cancelled) {
          setProfile(mergedProfile);
          setDraft(mergedProfile);
          setTrips(tripsData);
          setUserPosts(postsData);
        }
        localStorage.setItem("user", JSON.stringify(mergedProfile));
      } catch (fetchError) {
        console.error(fetchError);
        if (!cancelled) setError("Could not load your profile right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const updateProfileState = (
    serverProfile: Partial<Profile> & Pick<Profile, "name" | "email">,
    localDetails: LocalProfileDetails
  ) => {
    const mergedProfile: Profile = {
      ...EMPTY_PROFILE,
      ...serverProfile,
      ...localDetails,
    };
    localStorage.setItem(PROFILE_DETAILS_KEY, JSON.stringify(localDetails));
    localStorage.setItem("user", JSON.stringify(mergedProfile));
    setProfile(mergedProfile);
    setDraft(mergedProfile);
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: draft.name }),
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Could not save your profile.");

      const data = (await response.json()) as {
        user: Partial<Profile> & Pick<Profile, "name" | "email">;
      };
      updateProfileState(data.user, {
        phone: draft.phone,
        city: draft.city,
        country: draft.country,
      });
      setEditing(false);
      setSaved(true);
    } catch (saveError) {
      console.error(saveError);
      setError("Your changes could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setError("");
    let avatarUrl = "";

    try {
      const cloudName =
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dbwymmt1i";
      const uploadPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "LDCEXODOO";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!uploadResponse.ok) {
        const uploadError = (await uploadResponse.json()) as {
          error?: { message?: string };
        };
        toast.error(
          `Cloudinary Error: ${uploadError.error?.message || "Check console"}`
        );
        return;
      }

      const uploadData = (await uploadResponse.json()) as {
        secure_url: string;
      };
      avatarUrl = uploadData.secure_url;

      const updateResponse = await fetch(
        "http://localhost:5000/api/auth/me",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl }),
          credentials: "include",
        }
      );

      if (!updateResponse.ok) {
        toast.error("Failed to update backend");
        throw new Error(`Backend update failed: ${updateResponse.status}`);
      }
      toast.success("Profile photo updated!");

      const updateData = (await updateResponse.json()) as {
        user: Partial<Profile> & Pick<Profile, "name" | "email">;
      };
      updateProfileState(updateData.user, {
        phone: profile.phone,
        city: profile.city,
        country: profile.country,
      });
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        avatarUrl
          ? "The image uploaded, but your profile could not be updated."
          : "Error uploading image to Cloudinary. Check your connection or ad blocker."
      );
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (logoutError) {
      console.error(logoutError);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem(PROFILE_DETAILS_KEY);
      router.push("/login");
    }
  };

  const now = new Date();
  const preplannedTrips = trips.filter(
    (trip) => new Date(trip.startDate) >= now
  );
  const previousTrips = trips.filter(
    (trip) => new Date(trip.startDate) < now
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
          <div className="flex gap-6">
            <Skeleton className="h-28 w-28 shrink-0 rounded-full" />
            <Skeleton className="h-52 flex-1 rounded-xl" />
          </div>
          <Skeleton className="mt-10 h-72 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-6 py-16 text-center">
          <p role="alert" className="text-destructive">
            {error || "Your profile is unavailable."}
          </p>
        </main>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wave">
              User Profile
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Your profile</h1>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleSignOut}
            className="h-9 gap-2 px-3"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-6 rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}

        <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3">
            <div className="group relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-muted bg-primary text-3xl font-bold text-primary-foreground sm:h-48 sm:w-48">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={`${profile.name}'s avatar`}
                  className="h-full w-full object-cover"
                />
              ) : initials ? (
                initials
              ) : (
                <UserIcon className="h-16 w-16" />
              )}
              <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
                <Camera className="h-8 w-8 text-white" />
                <span className="sr-only">Change profile photo</span>
              </label>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {uploadingAvatar ? "Uploading..." : "Hover & click to change"}
            </p>
          </div>

          <div className="min-w-0 flex-1 rounded-xl border border-border bg-card p-6">
            {editing ? (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldInput
                    id="name"
                    label="Name"
                    value={draft.name}
                    onChange={(value) => setDraft({ ...draft, name: value })}
                    required
                  />
                  <FieldInput
                    id="email"
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={() => undefined}
                    disabled
                  />
                  <FieldInput
                    id="phone"
                    label="Phone"
                    type="tel"
                    value={draft.phone}
                    onChange={(value) => setDraft({ ...draft, phone: value })}
                  />
                  <FieldInput
                    id="city"
                    label="City"
                    value={draft.city}
                    onChange={(value) => setDraft({ ...draft, city: value })}
                  />
                  <FieldInput
                    id="country"
                    label="Country"
                    value={draft.country}
                    onChange={(value) => setDraft({ ...draft, country: value })}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Phone, city, and country are kept on
                  this device; your name is saved to your account.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={saving} className="h-10 px-5">
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setDraft(profile);
                      setEditing(false);
                    }}
                    className="h-10 px-5"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-3xl font-bold tracking-tight">
                      {profile.name}
                    </h2>
                    <p className="truncate text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(profile);
                      setEditing(true);
                      setSaved(false);
                    }}
                    className="h-9 shrink-0 gap-2 px-3"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Information
                  </Button>
                </div>

                <dl className="grid gap-3 sm:grid-cols-3">
                  <Detail label="Phone" value={profile.phone} />
                  <Detail label="City" value={profile.city} />
                  <Detail label="Country" value={profile.country} />
                </dl>

                {saved && (
                  <p className="text-xs font-medium text-wave">Saved.</p>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <SectionHeading>Personal Travel Preferences</SectionHeading>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Travel Persona Selection */}
            <div className="rounded-xl border border-border/80 bg-card p-6 shadow-2xs">
              <h3 className="font-bold text-base text-marine dark:text-foreground mb-1">
                Travel Persona
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Personalizes destination suggestions, activity recommendations, and budget targets.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(PERSONA_LABELS) as TravelPersona[]).map((key) => {
                  const p = PERSONA_LABELS[key];
                  const isSelected = prefs.persona === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handlePersonaChange(key)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-wave bg-wave/10 ring-1 ring-wave"
                          : "border-border/60 hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-lg mb-1">{p.icon}</div>
                      <div className="font-semibold text-xs text-marine dark:text-foreground">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{p.tag}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency & Pace Settings */}
            <div className="rounded-xl border border-border/80 bg-card p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-marine dark:text-foreground mb-1">
                  Preferred Currency & Travel Pace
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Set default financial currency and preferred itinerary pacing.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Preferred Currency</label>
                    <div className="flex gap-2">
                      {["$", "€", "₹", "£"].map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => handleCurrencyChange(curr)}
                          className={`w-11 h-9 rounded-md border font-bold text-sm transition-all ${
                            prefs.currency === curr
                              ? "bg-marine text-white border-marine shadow-2xs"
                              : "bg-muted/40 border-border/60 hover:bg-muted"
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-2">Active Travel Style</label>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-3">
                      <span className="text-2xl">{PERSONA_LABELS[prefs.persona]?.icon || "✈️"}</span>
                      <div>
                        <p className="text-xs font-bold text-marine dark:text-foreground">
                          {PERSONA_LABELS[prefs.persona]?.label} ({prefs.currency})
                        </p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {PERSONA_LABELS[prefs.persona]?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TripRow title="Preplanned Trips" trips={preplannedTrips} />
        <TripRow title="Previous Trips" trips={previousTrips} />

        <section className="mt-10">
          <SectionHeading>Posts by me</SectionHeading>
          {userPosts.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              You haven&apos;t made any community posts yet.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {userPosts.map((item) => (
                <article
                  key={item.post.id}
                  onClick={() => setSelectedPostId(item.post.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPostId(item.post.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex min-h-[280px] cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.post.imageUrls && item.post.imageUrls.length > 0 && (
                    <div className="h-40 w-full shrink-0 bg-muted">
                      <ImageCarousel imageUrls={item.post.imageUrls} />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h3 className="mb-1 line-clamp-1 text-lg font-semibold">
                        {item.post.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.post.content}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(item.post.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 transition-colors hover:text-red-500">
                          <Heart className="h-3 w-3" />
                          {item.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1 transition-colors hover:text-primary">
                          <MessageCircle className="h-3 w-3" />
                          {item.commentsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <PostModal
        postId={selectedPostId}
        isOpen={Boolean(selectedPostId)}
        onClose={() => setSelectedPostId(null)}
      />
    </div>
  );
}

function TripRow({ title, trips }: { title: string; trips: Trip[] }) {
  return (
    <section className="mt-10">
      <SectionHeading>{title}</SectionHeading>

      {trips.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {title === "Preplanned Trips"
              ? "No upcoming trips."
              : "No previous trips."}
          </p>
          <Link
            href="/trips/new"
            className="mt-2 inline-block text-sm font-medium text-wave hover:underline"
          >
            Plan a trip
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <article
              key={trip.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {trip.coverPhotoUrl ? (
                  <img
                    src={trip.coverPhotoUrl}
                    alt={trip.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                    <MapPin className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <p className="truncate font-semibold">{trip.name}</p>
                  <p className="mt-1 flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {formatRange(trip.startDate, trip.endDate)}
                  </p>
                  {typeof trip.stopCount === "number" && (
                    <p className="text-sm text-muted-foreground">
                      {trip.stopCount} cities
                    </p>
                  )}
                </div>
                <Link
                  href={`/trips/${trip.id}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-auto h-10 w-full"
                  )}
                >
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="shrink-0 text-lg font-bold tracking-tight">{children}</h2>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">
        {value || <span className="text-muted-foreground">Not set</span>}
      </dd>
    </div>
  );
}

function FieldInput({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10"
      />
      {disabled && id === "email" && (
        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
      )}
    </div>
  );
}
