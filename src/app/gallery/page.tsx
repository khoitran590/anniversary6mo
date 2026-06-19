import fs from "node:fs";
import path from "node:path";

import Link from "next/link";

import { PixelBorder } from "@/components/pixel-frame";
import {
  PixelCrown,
  PixelHeart,
  PixelHydrangea,
  PixelLily,
  PixelPeony,
  PixelSparkle,
  PixelStar,
} from "@/components/pixel-art";
import { MapGallery } from "@/components/map-gallery";

// Photos are read from disk at build time, so prerender the gallery to static
// HTML for instant, zero-compute loads in production. (The dev server still
// re-runs this on every reload, so newly-added photos show up while editing.)
export const dynamic = "force-static";

/**
 * Location-based photo groups. Each location can hold multiple photos.
 *
 * 📍 To pin a place, just write its name in `place` — any search you'd type
 *    into Google Maps works ("Joshua Tree National Park, CA", "Griffith
 *    Observatory", "1600 Pennsylvania Ave"). It's auto-converted to map
 *    coordinates for you, so you never deal with latitude/longitude.
 *    (If you ever want pixel-perfect placement you can still pass `lat`/`lng`
 *    instead, but `place` is the easy way.)
 *
 * `photoIndices` picks which photos (by sorted file order, 0 = first file)
 * belong here, and `captions` lines up with them one-to-one.
 */
const LOCATIONS = [
  {
    id: "home",
    name: "Home 🏠",
    place: "Los Angeles, CA",
    captions: [
      "Your first gift for me ☀️",
      "First bouquet of flowers 💐",
    ],
    photoIndices: [0, 1],
  },
  {
    id: "joshua-tree",
    name: "Joshua Tree 🌵",
    place: "Joshua Tree National Park, CA",
    captions: [
      "Early anni trip to Joshua Tree 🌵",
      "Our first milky way photo 🌌",
    ],
    photoIndices: [3, 14],
  },
  {
    id: "edc",
    name: "EDC 🎉",
    place: "Las Vegas Motor Speedway, NV",
    captions: [
      "Our first EDC together 🎉",
    ],
    photoIndices: [8],
  },
  {
    id: "hiking",
    name: "Hiking Trail 🥾",
    place: "Angeles National Forest, CA",
    captions: [
      "1st actual hiking trip 🥾",
      "My favorite holding hand photo 🙈",
    ],
    photoIndices: [13, 9],
  },
  {
    id: "studio",
    name: "Photo Studio 📸",
    place: "Santa Monica, CA",
    captions: [
      "Our first film photo 🎥",
      "I admire your beauty 💋",
      "How I imagine us posing in the future 🤩",
    ],
    photoIndices: [6, 11, 12],
  },
  {
    id: "flowers",
    name: "Flower Shop 🌸",
    place: "Downtown Los Angeles Flower District, CA",
    captions: [
      "Made another bouquet just for GF day 💖",
      "Just because bouquet 🌸",
    ],
    photoIndices: [4, 5],
  },
  {
    id: "birthday",
    name: "Birthday Spot 🎁",
    place: "Beverly Hills, CA",
    captions: [
      "Your birthday gift 🎁",
    ],
    photoIndices: [7],
  },
  {
    id: "memories",
    name: "Special Moment 💕",
    place: "Manhattan Beach, CA",
    captions: [
      "I love how we look at each other 💕",
    ],
    photoIndices: [2],
  },
];

// pastel mat colours, cycled across the frames
const TINTS = [
  "#ffe3f1",
  "#e3f3ff",
  "#fff0c9",
  "#eafbe6",
  "#f1e6ff",
  "#ffe9d6",
];

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Auto-discover every image dropped into public/photos (any filename works). */
function getPhotos(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "photos");
    return fs
      .readdirSync(dir)
      .filter((f) => IMAGE_RE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

/**
 * Turn a written place name into map coordinates — at build time, using the
 * free OpenStreetMap (Nominatim) service. This is why you can just type a place
 * name in LOCATIONS above and never deal with latitude/longitude, and why no
 * extra Google "Geocoding API" needs to be enabled on your key.
 */
type ResolvedLocation = (typeof LOCATIONS)[number] & { lat?: number; lng?: number };

async function geocodePlace(place: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      place
    )}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "anniversary-gallery/1.0 (personal site)" },
      // Cache the lookup so repeated builds don't re-hit the service.
      next: { revalidate: false },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = data[0];
    if (!hit) return null;
    return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
  } catch {
    return null;
  }
}

/** Resolve every location's `place` to coordinates, in order (Nominatim asks
 *  callers to keep it to ~1 request/second, and we only have a handful). */
async function resolveLocations(): Promise<ResolvedLocation[]> {
  const out: ResolvedLocation[] = [];
  for (const loc of LOCATIONS) {
    const coords = loc.place ? await geocodePlace(loc.place) : null;
    out.push({ ...loc, ...(coords ?? {}) });
  }
  return out;
}

/* Scattered 8-bit flowers + hearts that drift behind the whole page. Spread
   down the full scroll height (top%) and out to both edges (left%) so the
   garden frames the map and photos without ever sitting on top of them.
   `hide` thins the garden on phones, where the content runs nearly edge-to-edge
   and a full scatter would crowd the map and intro text. */
const SPRITES = [
  { el: <PixelHeart pixel={6} />, top: "3%", left: "4%", cls: "animate-float" },
  { el: <PixelHydrangea pixel={6} />, top: "6%", left: "91%", cls: "animate-bob" },
  { el: <PixelPeony pixel={6} />, top: "12%", left: "1%", cls: "animate-float", hide: true },
  { el: <PixelLily pixel={5} />, top: "16%", left: "94%", cls: "animate-bob", hide: true },
  { el: <PixelSparkle pixel={5} color="#fff3b0" />, top: "22%", left: "6%", cls: "animate-twinkle" },
  { el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#fff" />, top: "28%", left: "95%", cls: "animate-float", hide: true },
  { el: <PixelHydrangea pixel={5} petal="#c4a3ff" center="#ece2ff" />, top: "36%", left: "2%", cls: "animate-bob", hide: true },
  { el: <PixelPeony pixel={5} petal="#ffa3c4" highlight="#ffe0ec" />, top: "44%", left: "93%", cls: "animate-float" },
  { el: <PixelStar pixel={5} color="#ffffff" />, top: "50%", left: "5%", cls: "animate-bob" },
  { el: <PixelLily pixel={6} />, top: "56%", left: "95%", cls: "animate-float", hide: true },
  { el: <PixelHeart pixel={6} />, top: "62%", left: "1%", cls: "animate-float", hide: true },
  { el: <PixelHydrangea pixel={6} />, top: "68%", left: "92%", cls: "animate-bob" },
  { el: <PixelPeony pixel={6} />, top: "74%", left: "4%", cls: "animate-float" },
  { el: <PixelSparkle pixel={5} />, top: "80%", left: "94%", cls: "animate-twinkle", hide: true },
  { el: <PixelLily pixel={5} />, top: "86%", left: "3%", cls: "animate-bob", hide: true },
  { el: <PixelHydrangea pixel={5} petal="#9db8ff" />, top: "90%", left: "91%", cls: "animate-float" },
  { el: <PixelPeony pixel={5} />, top: "94%", left: "6%", cls: "animate-bob", hide: true },
  { el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#fff" />, top: "96%", left: "92%", cls: "animate-float" },
];

export default async function GalleryPage() {
  const photos = getPhotos();
  const locations = await resolveLocations();

  return (
    <main className="relative min-h-screen overflow-hidden bg-pastel-blue">
      {/* floating 8-bit garden behind everything (hearts + flowers).
          The outer span owns position + responsive scale/visibility; the inner
          span owns the drift animation, so the scale transform never fights the
          keyframes. On phones the garden is scaled down and thinned (`hide`). */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {SPRITES.map((s, i) => (
          <span
            key={i}
            className={`absolute origin-center scale-[0.6] sm:scale-100 ${
              s.hide ? "hidden sm:inline-block" : "inline-block"
            }`}
            style={{ top: s.top, left: s.left }}
          >
            <span className={`inline-block ${s.cls}`}>{s.el}</span>
          </span>
        ))}
      </div>

      {/* sticky top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-2 border-b-[6px] border-foreground bg-pastel-blue/90 px-3 py-2.5 backdrop-blur sm:px-4 sm:py-3">
        <Link
          href="/"
          className="pixel-btn retro relative inline-flex shrink-0 items-center gap-1.5 bg-secondary px-3 py-2.5 text-[9px] text-primary sm:gap-2 sm:px-4 sm:py-3 sm:text-xs"
        >
          ← BACK
          <PixelBorder t={5} />
        </Link>

        <div className="flex min-w-0 items-center justify-center gap-1.5 sm:gap-2">
          <span className="shrink-0">
            <PixelCrown pixel={4} />
          </span>
          <h1 className="retro whitespace-nowrap text-[9px] text-primary sm:text-sm">
            OUR MEMORIES
          </h1>
          <span className="shrink-0">
            <PixelCrown pixel={4} />
          </span>
        </div>

        {/* lily → secret invitation */}
        <Link
          href="/invitation"
          aria-label="Open your invitation"
          title="A little something for you…"
          className="pixel-btn group flex shrink-0 items-center gap-2"
        >
          <span className="retro hidden text-[8px] text-primary/70 transition-colors group-hover:text-primary md:inline">
            tap me 💌
          </span>
          <span className="animate-bob transition-transform group-hover:scale-125 group-hover:rotate-12">
            <PixelLily pixel={4} />
          </span>
        </Link>
      </header>

      {/* intro line */}
      <div className="relative z-10 px-5 pt-8 text-center">
        <p className="retro text-[10px] leading-relaxed text-primary sm:text-xs">
          every little moment, spread out across our journey 📍💖
        </p>
      </div>

      {/* map gallery section */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-28 pt-6">
        <MapGallery
          locations={locations}
          photos={photos}
          tints={TINTS}
        />
      </section>

      {/* closing note */}
      <footer className="relative z-10 flex flex-col items-center gap-3 pb-16">
        <div className="flex items-center gap-2">
          <PixelHeart pixel={5} />
          <PixelHeart pixel={6} />
          <PixelHeart pixel={5} />
        </div>
        <p className="retro text-center text-[9px] leading-relaxed text-primary sm:text-[10px]">
          happy anniversary, my princess 👑
        </p>
      </footer>
    </main>
  );
}
