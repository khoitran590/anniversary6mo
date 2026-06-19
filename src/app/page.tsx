"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
          <PixelCrown pixel={7} />
        </div>

{/* ===== Game Boy Advance SP — 1.5x SCALED ===== */}
<div id="gameboy-container" style={{ perspective: "1600px" }} className="w-[450px] max-w-[92vw]">
          {/* ----- LID (top half, hinges up) ----- */}
          <div className="animate-lid-open relative z-20 rounded-t-[27px] rounded-b-[12px] border-[4px] border-b-0 border-[#5b9bd5] bg-gradient-to-b from-[#b9def7] to-[#8fc6ee] px-6 pb-4 pt-7 shadow-[0_-6px_15px_rgba(45,42,74,0.15)]">
            {/* screen bezel */}
            <div className="rounded-[12px] bg-[#23202f] px-6 pb-4 pt-6">
              {/* the LCD — message scrolls uniformly if it overflows */}
              <div className="animate-screen-on relative h-[225px] overflow-hidden rounded-[4px] border-[4px] border-[#0e0c16] bg-gradient-to-b from-[#eaf6ff] to-[#cfe9ff]">
                {/* scanline sheen */}
                <div
                  className="pointer-events-none absolute inset-0 z-10 opacity-30"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg,transparent 0 4px,rgba(255,255,255,0.5) 4px 6px)",
                  }}
                />
                <div className="animate-marquee-y">
                  {[0, 1].map((dup) => (
                    <div
                      key={dup}
                      aria-hidden={dup === 1}
                      className="flex flex-col items-center gap-2 py-9 text-center"
                    >
                      <PixelHeart pixel={6} />
                      <span className="retro mt-3 text-lg leading-tight text-[#2452a6]">
                        HAPPY
                      </span>
                      <span className="retro text-lg leading-tight text-[#2452a6]">
                        ANNIVERSARY
                      </span>
                      <span className="retro text-xs leading-tight text-[#c2477e]">
                        MY PRINCESS
                      </span>
                      <PixelHeart pixel={6} />
                    </div>
                  ))}
                </div>
              </div>
              {/* GAME BOY ADVANCE SP wordmark under the screen */}
              <p className="mt-3 text-center text-[10px] font-extrabold italic tracking-tight text-[#cfe9ff]">
                GAME BOY ADVANCE SP
              </p>
            </div>
          </div>

          {/* hinge band */}
          <div className="relative z-30 -my-[3px] h-[18px] rounded-[4px] border-x-[4px] border-[#5b9bd5] bg-gradient-to-b from-[#7bb8e8] to-[#5b9bd5]" />

          {/* ----- BASE (bottom half, the controls) ----- */}
          <div className="relative z-10 rounded-b-[27px] rounded-t-[12px] border-[4px] border-t-0 border-[#5b9bd5] bg-gradient-to-b from-[#a8d4f0] to-[#8fc6ee] px-7 pb-9 pt-7">
            <div className="flex items-start justify-between">
              {/* decorative D-pad */}
              <div className="relative mt-1 h-[87px] w-[87px]">
                <div className="absolute left-1/2 top-0 h-full w-[30px] -translate-x-1/2 rounded-[4px] bg-gradient-to-b from-[#4a4658] to-[#2c2838]" />
                <div className="absolute top-1/2 left-0 h-[30px] w-full -translate-y-1/2 rounded-[4px] bg-gradient-to-b from-[#4a4658] to-[#2c2838]" />
                <div className="absolute left-1/2 top-1/2 h-[24px] w-[24px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f1c2a]" />
              </div>

{/* A = READY (go), B = NOT READY (dodges) */}
             {/* A = READY (go), B = NOT READY (dodges) */}
             <div className="flex -translate-y-2 items-end gap-6">
                <div className="flex flex-col items-center gap-3">
                  <DodgeButton
                    onDodge={handleDodge}
                    avoidId="gameboy-container"
                    // Using NES.css error button for the "dodge" action
                    className="nes-btn is-error !flex !h-[72px] !w-[72px] !min-w-0 items-center justify-center !p-0 text-2xl"
                  >
                    B
                  </DodgeButton>
                  <span className="retro text-[10px] text-primary">NOT READY</span>
                </div>
                
                <div className="flex -translate-y-4 flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReady}
                    aria-label="Ready — go to the gallery"
                    // Using NES.css success button for the "ready" action
                    className="nes-btn is-success !flex !h-[72px] !w-[72px] !min-w-0 items-center justify-center !p-0 text-2xl"
                  >
                    A
                  </button>
                  <span className="retro text-[10px] text-primary">READY</span>
                </div>
              </div>
              </div>

            {/* START / SELECT pills (decorative) */}
            <div className="mt-7 flex items-center justify-center gap-6">
              {["SELECT", "START"].map((c) => (
                <div key={c} className="flex -rotate-[20deg] flex-col items-center gap-1.5">
                  <span className="h-[15px] w-[48px] rounded-full bg-gradient-to-b from-[#4a4658] to-[#2c2838]" />
                  <span className="text-[9px] font-bold tracking-widest text-[#3a6ea5]">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* heart divider / hint */}
        <div className="flex items-center gap-3">
          <PixelHeart pixel={5} />
          <p className="retro text-xs text-primary sm:text-sm">
            press A when you&apos;re READY 💖
          </p>
          <PixelHeart pixel={5} />
        </div>

        {/* teasing line */}
        <p
          className="retro h-6 text-xs text-primary transition-opacity duration-200 sm:text-sm"
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
