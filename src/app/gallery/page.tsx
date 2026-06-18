import fs from "node:fs";
import path from "node:path";

import Link from "next/link";

import { PixelFrame, PixelBorder } from "@/components/pixel-frame";
import {
  PixelCrown,
  PixelHeart,
  PixelLily,
  PixelSparkle,
  PixelStar,
} from "@/components/pixel-art";

// render fresh each request in dev so newly-added photos show up on reload
export const dynamic = "force-dynamic";

/**
 * Captions, assigned to photos by sorted file order (slot 0 = first file, …).
 * Edit any line to change that slot's caption; reorder your files (or rename
 * them, e.g. 01.jpg, 02.jpg) to control which photo lands where. If you have
 * more photos than captions, the list simply repeats.
 */
const CAPTIONS = [
  "Your first gift for me ☀️",
  "First time carrying you 💑",
  "Your first bouquet of flowers 💐",
  "Love how we look at each other 💕",
  "Early anni trip to Joshua Tree 🌵",
  "Made another bouquet just because 💖",
  "Just because flowers are pretty like you🌸",
  "sunset walk 🌇",
  "Your birthday gift 🎁",
  "Our first EDC 🎉",
  "My favorite holding hand photo 🙈",

  "I admire your beauty 💋",
  "How I imagine us posing in the future 🤩",
  "1st actual hiking trip 🥾",
  "Our first milky way photo 🌌",

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

const PLACEHOLDER_COUNT = 8;
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

/** Deterministic pseudo-random in [0,1) from a seed — stable across renders so
 *  the scatter doesn't reshuffle on every request. */
function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type Slot = {
  src?: string;
  caption: string;
  rot: number; // subtle tilt (degrees) for the scattered scrapbook look
  tint: string;
};

/** One frame per photo (or placeholder frames when the folder is empty). The
 *  frames flow in a responsive multi-column collage that reflows to fit any
 *  screen — 1 column on phones, 2 on tablets, 3 on desktop — so every photo
 *  stays big, fully visible, and never clips or overlaps. */
function buildSlots(): Slot[] {
  const photos = getPhotos();
  const count = photos.length > 0 ? photos.length : PLACEHOLDER_COUNT;
  return Array.from({ length: count }, (_, i) => {
    const file = photos[i];
    return {
      src: file ? `/photos/${encodeURIComponent(file)}` : undefined,
      caption: CAPTIONS[i % CAPTIONS.length],
      rot: (seeded(i * 3 + 2) - 0.5) * 8, // ±4°
      tint: TINTS[i % TINTS.length],
    };
  });
}

// scattered background sprites
const SPRITES = [
  { el: <PixelHeart pixel={6} />, top: "4%", left: "62%", cls: "animate-float" },
  { el: <PixelSparkle pixel={6} color="#fff3b0" />, top: "24%", left: "8%", cls: "animate-twinkle" },
  { el: <PixelStar pixel={6} color="#ffffff" />, top: "47%", left: "70%", cls: "animate-bob" },
  { el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#fff" />, top: "70%", left: "92%", cls: "animate-float" },
  { el: <PixelSparkle pixel={5} />, top: "88%", left: "10%", cls: "animate-twinkle" },
  { el: <PixelStar pixel={5} color="#ffd0e2" />, top: "66%", left: "37%", cls: "animate-bob" },
];

export default function GalleryPage() {
  const slots = buildSlots();

  return (
    <main className="relative min-h-screen overflow-hidden bg-pastel-blue">
      {/* sticky top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b-[6px] border-foreground bg-pastel-blue/90 px-4 py-3 backdrop-blur">
        <Link
          href="/"
          className="retro relative inline-flex items-center gap-2 bg-secondary px-4 py-3 text-[10px] text-primary active:translate-y-0.5 sm:text-xs"
        >
          ← BACK
          <PixelBorder t={5} />
        </Link>

        <div className="flex items-center gap-2">
          <PixelCrown pixel={5} />
          <h1 className="retro text-[11px] text-primary sm:text-sm">
            OUR MEMORIES
          </h1>
          <PixelCrown pixel={5} />
        </div>

        {/* lily → secret invitation */}
        <Link
          href="/invitation"
          aria-label="Open your invitation"
          title="A little something for you…"
          className="group flex items-center gap-2 active:translate-y-0.5"
        >
          <span className="retro hidden text-[8px] text-primary/70 transition-colors group-hover:text-primary md:inline">
            tap me 💌
          </span>
          <span className="animate-bob transition-transform group-hover:scale-110">
            <PixelLily pixel={5} />
          </span>
        </Link>
      </header>

      {/* intro line */}
      <div className="relative z-10 px-5 pt-8 text-center">
        <p className="retro text-[10px] leading-relaxed text-primary sm:text-xs">
          every little moment, spread out just for you 💖
        </p>
      </div>

      {/* photo collage — a responsive multi-column scrapbook you scroll through.
          Reflows from 1 column on phones up to 3 on desktop, so every photo
          stays big, fully visible, and never clips or overlaps. */}
      <section className="relative mx-auto w-full max-w-4xl px-5 pb-28 pt-6 sm:px-4">
        {/* floating sprites (behind the photos) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          {SPRITES.map((s, i) => (
            <span
              key={i}
              className={`absolute ${s.cls}`}
              style={{ top: s.top, left: s.left }}
            >
              {s.el}
            </span>
          ))}
        </div>

        <div className="relative z-10 columns-1 gap-7 sm:columns-2 lg:columns-3">
          {slots.map((s, i) => (
            <div
              key={s.src ?? i}
              className="mb-7 break-inside-avoid"
              style={{ transform: `rotate(${s.rot}deg)` }}
            >
              <div
                className="animate-pop"
                style={{ animationDelay: `${Math.min(i * 60, 1200)}ms` }}
              >
                <PixelFrame
                  src={s.src}
                  caption={s.caption}
                  tint={s.tint}
                  alt={s.caption}
                />
              </div>
            </div>
          ))}
        </div>
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
