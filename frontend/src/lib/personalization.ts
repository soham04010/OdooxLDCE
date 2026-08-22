"use client";

export type TravelPersona = "budget" | "luxury" | "cultural" | "adventure";

export interface UserPreferences {
  persona: TravelPersona;
  currency: string;
  travelPace: "relaxed" | "balanced" | "fast";
  wishlist: string[]; // City IDs
}

const STORAGE_KEY = "globetrotter_user_prefs";

export const DEFAULT_PREFERENCES: UserPreferences = {
  persona: "budget",
  currency: "$",
  travelPace: "balanced",
  wishlist: [],
};

export function getUserPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const current = getUserPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleWishlistCity(cityId: string): boolean {
  const current = getUserPreferences();
  const exists = current.wishlist.includes(cityId);
  const updatedWishlist = exists
    ? current.wishlist.filter((id) => id !== cityId)
    : [...current.wishlist, cityId];

  saveUserPreferences({ wishlist: updatedWishlist });
  return !exists; // Returns true if added, false if removed
}

export function isCityWishlisted(cityId: string): boolean {
  const current = getUserPreferences();
  return current.wishlist.includes(cityId);
}

export const PERSONA_LABELS: Record<TravelPersona, { label: string; icon: string; tag: string; description: string }> = {
  budget: {
    label: "Budget Explorer",
    icon: "🎒",
    tag: "Cost Conscious",
    description: "Tailored to high-value, affordable destinations and budget-friendly activities.",
  },
  luxury: {
    label: "Luxury Voyager",
    icon: "🏨",
    tag: "Premium & Fine Dining",
    description: "Highlights top-rated resort cities, high popularity scores, and premium stays.",
  },
  cultural: {
    label: "Foodie & Culture Enthusiast",
    icon: "🍷",
    tag: "Museums & Local Eats",
    description: "Focuses on historical landmarks, local food tours, and rich heritage stops.",
  },
  adventure: {
    label: "Thrill & Outdoor Seeker",
    icon: "🏔️",
    tag: "Nature & Hiking",
    description: "Recommends national parks, mountain regions, and active outdoor excursions.",
  },
};
