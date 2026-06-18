"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/8bit/button";
import { DodgeButton } from "@/components/dodge-button";
import {
  PixelCrown,
  PixelHeart,
  PixelLily,
  PixelSparkle,
  PixelStar,
} from "@/components/pixel-art";

const TEASES = [
  "not ready? you can't escape! 🏃‍♀️💨",
  "hehe, catch me first 😝",
  "pls don't run away babi 😩",
  "just click READY my queen 👑",
  "okay okay, pretty please? 🥺",
  "you're stuck with me forever 💖",
];

// floating background sprites
type Decor = {
  el: React.ReactNode;
  className: string;
  style: React.CSSProperties;
};

const DECOR: Decor[] = [
  {
    el: <PixelHeart pixel={7} />,
    className: "animate-float",
    style: { top: "12%", left: "8%", animationDelay: "0s" },
  },
  {
    el: <PixelSparkle pixel={6} />,
    className: "animate-twinkle",
    style: { top: "22%", right: "12%", animationDelay: ".3s" },
  },
  {
    el: <PixelStar pixel={6} />,
    className: "animate-float",
    style: { top: "60%", left: "6%", animationDelay: ".6s" },
  },
  {
    el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#ffe2ee" />,
    className: "animate-bob",
    style: { bottom: "16%", right: "9%", animationDelay: ".2s" },
  },
  {
    el: <PixelSparkle pixel={5} color="#fff3b0" />,
    className: "animate-twinkle",
    style: { top: "44%", right: "6%", animationDelay: ".9s" },
  },
  {
    el: <PixelStar pixel={5} color="#ffd0e2" />,
    className: "animate-bob",
    style: { bottom: "12%", left: "14%", animationDelay: ".5s" },
  },
  {
    el: <PixelSparkle pixel={4} color="#ffffff" />,
    className: "animate-twinkle",
    style: { top: "8%", left: "46%", animationDelay: "1.1s" },
  },
  {
    el: <PixelHeart pixel={4} color="#ff6fa6" highlight="#ffd9e8" />,
    className: "animate-float",
    style: { bottom: "30%", left: "44%", animationDelay: ".75s" },
  },

  // lilies scattered around the edges
  {
    el: <PixelLily pixel={5} />,
    className: "animate-float",
    style: { top: "30%", left: "3%", animationDelay: ".4s" },
  },
  {
    el: <PixelLily pixel={4} petal="#ffa6cf" />,
    className: "animate-bob",
    style: { top: "15%", right: "5%", animationDelay: ".8s" },
  },
  {
    el: <PixelLily pixel={5} />,
    className: "animate-float",
    style: { bottom: "20%", right: "4%", animationDelay: ".25s" },
  },
  {
    el: <PixelLily pixel={4} petal="#ff7ab0" />,
    className: "animate-bob",
    style: { bottom: "7%", left: "26%", animationDelay: ".6s" },
  },
  {
    el: <PixelLily pixel={4} />,
    className: "animate-float",
    style: { top: "54%", right: "12%", animationDelay: "1s" },
  },
  {
    el: <PixelLily pixel={4} petal="#ffa6cf" />,
    className: "animate-bob",
    style: { top: "4%", left: "70%", animationDelay: ".5s" },
  },

  // a few more hearts
  {
    el: <PixelHeart pixel={5} />,
    className: "animate-bob",
    style: { top: "36%", left: "13%", animationDelay: ".15s" },
  },
  {
    el: <PixelHeart pixel={4} color="#ff8fb8" highlight="#ffe2ee" />,
    className: "animate-float",
    style: { top: "5%", left: "28%", animationDelay: ".9s" },
  },
  {
    el: <PixelHeart pixel={6} />,
    className: "animate-float",
    style: { bottom: "42%", right: "11%", animationDelay: ".35s" },
  },
  {
    el: <PixelHeart pixel={4} color="#ff6fa6" highlight="#ffd9e8" />,
    className: "animate-bob",
    style: { top: "72%", right: "9%", animationDelay: ".7s" },
  },
  {
    el: <PixelHeart pixel={5} color="#ff8fb8" highlight="#fff" />,
    className: "animate-float",
    style: { bottom: "6%", right: "33%", animationDelay: "1.1s" },
  },
  {
    el: <PixelHeart pixel={4} />,
    className: "animate-bob",
    style: { top: "50%", left: "16%", animationDelay: ".55s" },
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [teaseIdx, setTeaseIdx] = React.useState<number | null>(null);
  const [leaving, setLeaving] = React.useState(false);

  // warm up the gallery route so the transition is instant
  React.useEffect(() => {
    router.prefetch("/gallery");
  }, [router]);

  const handleDodge = (count: number) => {
    setTeaseIdx((count - 1) % TEASES.length);
  };

  const handleReady = () => {
    setLeaving(true);
    setTimeout(() => router.push("/gallery"), 420);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-pastel-pink px-5 py-16 text-center">
      {/* floating pixel decorations */}
      <div className="pointer-events-none absolute inset-0">
        {DECOR.map((d, i) => (
          <span key={i} className={`absolute ${d.className}`} style={d.style}>
            {d.el}
          </span>
        ))}
      </div>

      {/* dithered cloud band along the bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 opacity-70"
        style={{
          background:
            "repeating-linear-gradient(90deg,#fff7fc 0 14px,transparent 14px 28px)",
          maskImage: "linear-gradient(to top, #000 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to top, #000 0%, transparent 100%)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center gap-7 transition-all duration-500 ${
          leaving ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* crown */}
        <div className="animate-float">
          <PixelCrown pixel={9} />
        </div>

        {/* title */}
        <h1 className="retro flex flex-col gap-3 text-white">
          <span className="pixel-text-shadow text-3xl leading-tight sm:text-4xl md:text-5xl">
            HAPPY
          </span>
          <span className="pixel-text-shadow text-2xl leading-tight sm:text-3xl md:text-5xl">
            ANNIVERSARY
          </span>
          <span className="pixel-text-shadow text-2xl leading-tight text-[#fff0a6] sm:text-3xl md:text-5xl">
            MY PRINCESS
          </span>
        </h1>

        {/* heart divider */}
        <div className="flex items-center gap-3">
          <PixelHeart pixel={5} />
          <p className="retro text-[10px] text-primary sm:text-xs">
            press start to celebrate us
          </p>
          <PixelHeart pixel={5} />
        </div>

        {/* buttons */}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-5">
          <Button
            size="lg"
            onClick={handleReady}
            className="retro bg-mint text-primary text-base md:text-lg px-8 py-6"
          >
            <span className="inline-flex items-center gap-2">
              READY
              <PixelHeart pixel={4} />
            </span>
          </Button>

          <DodgeButton onDodge={handleDodge}>NOT READY</DodgeButton>
        </div>

        {/* teasing line */}
        <p
          className="retro h-6 text-[10px] text-primary transition-opacity duration-200 sm:text-xs"
          style={{ opacity: teaseIdx === null ? 0 : 1 }}
        >
          {teaseIdx === null ? " " : TEASES[teaseIdx]}
        </p>
      </div>

      {/* corner star */}
      <div className="pointer-events-none absolute right-5 top-5 animate-twinkle">
        <PixelStar pixel={5} color="#ffffff" />
      </div>
    </main>
  );
}
