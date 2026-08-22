/**
 * Sample content for the screens built ahead of the API.
 *
 * Shapes match the payloads in the backend spec, so swapping these arrays
 * for `GET /api/dashboard` later is a straight substitution — the components
 * don't need to change. Photos live in `public/cities/`.
 */

export type City = {
  id: string;
  name: string;
  region: string;
  country: string;
  imageUrl: string;
  costIndex: number; // 1–100
};

export type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  stopCount: number;
  coverPhotoUrl: string;
};

export const topCities: City[] = [
  {
    id: "leh",
    name: "Leh",
    region: "Ladakh",
    country: "India",
    imageUrl: "/cities/leh.jpg",
    costIndex: 58,
  },
  {
    id: "srinagar",
    name: "Srinagar",
    region: "Kashmir",
    country: "India",
    imageUrl: "/cities/srinagar.jpg",
    costIndex: 46,
  },
  {
    id: "agra",
    name: "Agra",
    region: "Uttar Pradesh",
    country: "India",
    imageUrl: "/cities/agra.jpg",
    costIndex: 34,
  },
  {
    id: "amritsar",
    name: "Amritsar",
    region: "Punjab",
    country: "India",
    imageUrl: "/cities/amritsar.jpg",
    costIndex: 30,
  },
  {
    id: "murudeshwar",
    name: "Murudeshwar",
    region: "Karnataka",
    country: "India",
    imageUrl: "/cities/murudeshwar.jpg",
    costIndex: 27,
  },
  {
    id: "sarahan",
    name: "Sarahan",
    region: "Himachal Pradesh",
    country: "India",
    imageUrl: "/cities/sarahan.jpg",
    costIndex: 25,
  },
];

export const previousTrips: Trip[] = [
  {
    id: "t1",
    name: "Ladakh on two wheels",
    startDate: "2026-06-08",
    endDate: "2026-06-16",
    stopCount: 3,
    coverPhotoUrl: "/cities/ladakh-road.jpg",
  },
  {
    id: "t2",
    name: "Kashmir in bloom",
    startDate: "2026-04-02",
    endDate: "2026-04-07",
    stopCount: 2,
    coverPhotoUrl: "/cities/sonamarg.jpg",
  },
  {
    id: "t3",
    name: "The Golden Triangle",
    startDate: "2025-11-14",
    endDate: "2025-11-20",
    stopCount: 3,
    coverPhotoUrl: "/cities/agra.jpg",
  },
  {
    id: "t4",
    name: "Coastal Karnataka",
    startDate: "2025-09-05",
    endDate: "2025-09-09",
    stopCount: 2,
    coverPhotoUrl: "/cities/murudeshwar.jpg",
  },
];

/** "8 – 16 Jun 2026" */
export function formatRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const day = (d: Date) => d.getDate();
  const mon = (d: Date) => d.toLocaleString("en-GB", { month: "short" });

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${day(s)} – ${day(e)} ${mon(e)} ${e.getFullYear()}`;
  }
  return `${day(s)} ${mon(s)} – ${day(e)} ${mon(e)} ${e.getFullYear()}`;
}

/** The 1–100 cost index means nothing to a traveller; bucket it. */
export function costLabel(index: number) {
  if (index < 33) return "Budget";
  if (index < 66) return "Mid-range";
  return "Pricey";
}

export type Slide = {
  id: string;
  imageUrl: string;
  place: string;
  region: string;
};

/** Hero carousel — the shots with the most pull, in rotation order. */
export const heroSlides: Slide[] = [
  {
    id: "pangong",
    imageUrl: "/cities/pangong-sunset.jpg",
    place: "Pangong Lake",
    region: "Ladakh",
  },
  {
    id: "sonamarg",
    imageUrl: "/cities/sonamarg.jpg",
    place: "Sonamarg",
    region: "Kashmir",
  },
  {
    id: "ladakh-road",
    imageUrl: "/cities/ladakh-road.jpg",
    place: "Leh–Manali Highway",
    region: "Ladakh",
  },
  {
    id: "srinagar",
    imageUrl: "/cities/srinagar.jpg",
    place: "Tulip Garden",
    region: "Srinagar",
  },
  {
    id: "amritsar",
    imageUrl: "/cities/amritsar.jpg",
    place: "Golden Temple",
    region: "Amritsar",
  },
];
