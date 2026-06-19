import type { Metadata } from "next";
import Link from "next/link";

import { PixelBorder } from "@/components/pixel-frame";
import { MusicPlayer } from "@/components/music-player";
import {
  PixelCrown,
  PixelHeart,
  PixelLily,
  PixelSparkle,
  PixelStar,
} from "@/components/pixel-art";

export const metadata: Metadata = {
  title: "You're Invited 💌",
  description: "A little invitation for my princess.",
};

/* 🎵 Paste your YouTube playlist link here (or just the list id).
   e.g. "https://www.youtube.com/playlist?list=PLxxxxxxxxxxxx"
   Leave it blank for now and the player shows a friendly placeholder. */
const PLAYLIST_LINK = "https://www.youtube.com/watch?v=ZEcqHA7dbwM";

const DETAILS: {
  label: string;
  value: string;
  chip: string;
}[] = [
  { label: "LOCATION", value: "Shorebird Restaurant", chip: "bg-mint" },
  { label: "DATE", value: "June 27, 2026", chip: "bg-sun" },
  { label: "TIME", value: "7:00 PM", chip: "bg-sun" },
  {
    label: "DRESS CODE",
    value: "White or black — as long as my princess is comfortable",
    chip: "bg-rose",
  },
];

// floating decorations
const DECOR = [
  { el: <PixelHeart pixel={6} />, cls: "animate-float", style: { top: "12%", left: "10%" } },
  { el: <PixelSparkle pixel={6} color="#fff3b0" />, cls: "animate-twinkle", style: { top: "20%", right: "12%" } },
  { el: <PixelStar pixel={5} color="#ffffff" />, cls: "animate-bob", style: { bottom: "16%", left: "12%" } },
  { el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#fff" />, cls: "animate-float", style: { bottom: "14%", right: "10%" } },
  { el: <PixelSparkle pixel={4} color="#ffffff" />, cls: "animate-twinkle", style: { top: "8%", left: "48%" } },
];

export default function InvitationPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden bg-pastel-pink px-5 py-20">
      {/* floating pixel decorations */}
      <div className="pointer-events-none absolute inset-0">
        {DECOR.map((d, i) => (
          <span key={i} className={`absolute ${d.cls}`} style={d.style}>
            {d.el}
          </span>
        ))}
      </div>

      {/* back to gallery */}
      <Link
        href="/gallery"
        className="pixel-btn retro absolute left-5 top-5 z-20 inline-flex items-center gap-2 bg-secondary px-4 py-3 text-[10px] text-primary sm:text-xs"
      >
        ← BACK
        <PixelBorder t={5} />
      </Link>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-6">
        {/* heading */}
        <div className="animate-float">
          <PixelLily pixel={8} />
        </div>
        <h1 className="retro flex flex-col items-center gap-2 text-center text-white">
          <span className="pixel-text-shadow text-2xl leading-tight sm:text-3xl">
            YOU&apos;RE
          </span>
          <span className="pixel-text-shadow text-3xl leading-tight text-[#fff0a6] sm:text-4xl">
            INVITED
          </span>
        </h1>
        <p className="retro text-center text-[14px] text-primary sm:text-sm">
          A date with your lulumelonnnnn 💖
        </p>

        {/* invitation card */}
        <div className="relative w-full bg-cream p-6 pixel-box-shadow sm:p-8">
          <div className="mb-5 flex items-center justify-center gap-3">
            <PixelHeart pixel={4} />
            <span className="retro text-[12px] text-primary sm:text-xs">
              SAVE THE DATE
            </span>
            <PixelHeart pixel={4} />
          </div>

          {/* solid divider (like the header rule on a retro panel) */}
          <div className="mb-2 h-1.5 w-full bg-foreground" />

          <dl className="flex flex-col">
            {DETAILS.map((d, i) => (
              <div key={d.label}>
                {i > 0 && (
                  <div className="border-t-4 border-dashed border-foreground/70" />
                )}
                <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <dt className="retro text-[10px] text-muted-foreground sm:text-xs">
                    {d.label}
                  </dt>
                  <dd
                    className={`retro pixel-box-shadow-sm inline-block max-w-full border-4 border-foreground px-3 py-2 text-[9px] leading-relaxed text-primary sm:text-right sm:text-[11px] ${d.chip}`}
                  >
                    {d.value}
                  </dd>
                </div>
              </div>
            ))}
          </dl>

          <PixelBorder t={6} />
        </div>

        {/* music player card — set the song mood for the date 🎶 */}
        <MusicPlayer playlist={PLAYLIST_LINK} />

        {/* footer */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <PixelCrown pixel={5} />
            <p className="retro text-[10px] text-primary sm:text-xs">
              can&apos;t wait to see you there
            </p>
            <PixelCrown pixel={5} />
          </div>
        </div>
      </div>
    </main>
  );
}
