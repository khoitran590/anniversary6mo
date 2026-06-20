"use client";

import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------------------
   A functional, retro-window music player for YouTube.
   Styled after a classic 8-bit OS window: "Your music" title bar with window
   buttons, beige body, chunky transport controls and a draggable seek bar.

   ▶ WHAT YOU CAN PASS to the `playlist` prop:
     • a single song   — "https://www.youtube.com/watch?v=XXXXXXXXXXX"
                          (or a "https://youtu.be/XXXXXXXXXXX" share link)
     • a whole playlist — "https://www.youtube.com/playlist?list=PLxxxxxxxx"
   Bare ids work too. We figure out which kind it is for you.
--------------------------------------------------------------------------- */

type YTSource =
  | { kind: "playlist"; id: string }
  | { kind: "video"; id: string };

/** Work out whether the input points at a single video or a whole playlist,
 *  and pull the relevant id out of any YouTube URL (or accept a bare id). */
function parseSource(input: string): YTSource | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // A playlist link wins if a `list=` id is present.
  const listMatch = trimmed.match(/[?&]list=([^&]+)/);
  if (listMatch) return { kind: "playlist", id: listMatch[1] };

  // Single video: watch?v=ID, youtu.be/ID, or /embed/ID.
  const videoMatch = trimmed.match(
    /(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/
  );
  if (videoMatch) return { kind: "video", id: videoMatch[1] };

  // Bare id: 11 chars → a video id; otherwise treat it as a playlist id.
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return { kind: "video", id: trimmed };
  return { kind: "playlist", id: trimmed };
}

/* Minimal structural types for the slice of the YouTube IFrame API we use,
   so we stay type-safe without pulling in @types/youtube. */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  previousVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  getVideoData(): { title?: string; author?: string; video_id?: string };
}

interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: string | number;
      height?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: YTPlayerEvent) => void;
        onStateChange?: (e: YTPlayerEvent) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Load the IFrame API script once, resolving when `window.YT` is ready. */
let ytReady: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (ytReady) return ytReady;
  ytReady = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.getElementById("youtube-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
  return ytReady;
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function MusicPlayer({ playlist }: { playlist?: string }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");

  const source = playlist ? parseSource(playlist) : null;
  const sourceKey = source ? `${source.kind}:${source.id}` : "";

  useEffect(() => {
    if (!source || !holderRef.current) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        width: "100%",
        height: "100%",
        // A single song loads via `videoId`; a playlist loads via playerVars.
        ...(source.kind === "video" ? { videoId: source.id } : {}),
        playerVars: {
          ...(source.kind === "playlist"
            ? { listType: "playlist", list: source.id }
            : // `playlist` set to the same id + `loop` makes one song repeat.
              { playlist: source.id, loop: 1 }),
          controls: 0, // we draw our own retro controls
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          autoplay: 1, // start the moment the invitation opens
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setReady(true);
            // kick playback off automatically when the page loads
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            setPlaying(e.data === YT.PlayerState.PLAYING);
          },
        },
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Poll the playhead so the seek bar tracks playback.
  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setCurrent(p.getCurrentTime());
      setDuration(p.getDuration());
      const t = p.getVideoData?.().title;
      if (t) setTitle(t);
    }, 400);
    return () => window.clearInterval(id);
  }, [ready]);

  const player = playerRef.current;
  const togglePlay = () => {
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!player || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    player.seekTo(fraction * duration, true);
    setCurrent(fraction * duration);
  };

  const pct = duration > 0 ? Math.min((current / duration) * 100, 100) : 0;

  // Try to split a "Title - Artist" video title for the marquee header.
  const heading = title || "newjeans — newjeans";

  return (
    <div
      /* Soft pastel "candy iPod": rounded lavender shell, double inner border,
         dreamy pink/purple palette to match the dollhouse music gadget. */
      className="pixel-box-shadow relative mx-auto w-full max-w-[400px] select-none rounded-[28px] border-[3px] border-[#caa9e0] bg-[#efdcf6] p-3 sm:p-4"
    >
      {/* ===== top title pill ===== */}
      <div className="mx-auto mb-3 w-fit max-w-full rounded-full border-[3px] border-[#caa9e0] bg-[#e3c7f0] px-5 py-2 shadow-[0_2px_0_#caa9e0]">
        <div className="overflow-hidden whitespace-nowrap">
          {heading.length > 22 ? (
            <div className="animate-marquee inline-block">
              <span className="text-[10px] font-bold tracking-[0.12em] text-[#7a4f96]">
                {heading}
              </span>
              <span className="px-8 text-[10px] font-bold tracking-[0.12em] text-[#7a4f96]">
                {heading}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold tracking-[0.18em] text-[#7a4f96] lowercase">
              {heading}
            </span>
          )}
        </div>
      </div>

      {/* ===== screen — shows the actual video, framed like the gadget ===== */}
      <div className="relative mx-auto overflow-hidden rounded-[14px] border-[4px] border-[#d3b6e8] bg-[#1b1825] shadow-[inset_0_0_0_3px_#f7ecfb]">
        {/* little bunny sticker, top-left like the reference */}
        <span className="pointer-events-none absolute left-1.5 top-1 z-10 text-[14px] drop-shadow-[1px_1px_0_rgba(0,0,0,0.4)]">
          🐰
        </span>

        {source ? (
          <div className="aspect-video w-full">
            <div ref={holderRef} className="h-full w-full" />
          </div>
        ) : (
          <p className="aspect-video flex items-center justify-center px-4 text-center text-[9px] font-bold leading-relaxed text-[#e3c7f0]">
            INSERT A SONG ♥<br />
            paste a YouTube link to play
          </p>
        )}

        {/* heart + seek bar overlaid on the bottom edge of the screen */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-4">
          <span className="text-[12px] leading-none text-[#ff9ed2] drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
            ♥
          </span>
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            tabIndex={0}
            onClick={seek}
            className="h-2 flex-1 cursor-pointer overflow-hidden rounded-full border border-white/70 bg-white/30"
          >
            <div
              className="h-full rounded-full bg-[#f7ecfb]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== controls deck ===== */}
      {!minimized && (
        <div className="mt-4 flex items-center justify-center gap-5">
          <CircleButton
            label="Previous track"
            disabled={!ready}
            onClick={() => player?.previousVideo()}
            size="sm"
          >
            <PrevIcon />
          </CircleButton>

          <CircleButton
            label={playing ? "Pause" : "Play"}
            disabled={!ready}
            onClick={togglePlay}
            size="lg"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </CircleButton>

          <CircleButton
            label="Next track"
            disabled={!ready}
            onClick={() => player?.nextVideo()}
            size="sm"
          >
            <NextIcon />
          </CircleButton>
        </div>
      )}

      {/* ===== bottom bar: Menu • elapsed • hearts ===== */}
      <div className="mt-4 flex items-center justify-between rounded-full border-[3px] border-[#caa9e0] bg-[#e3c7f0] px-4 py-2">
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          className="text-[11px] font-bold lowercase tracking-wide text-[#7a4f96]"
        >
          {minimized ? "▲ open" : "menu"}
        </button>
        <span className="text-[9px] font-bold tabular-nums text-[#9a78b3]">
          {formatTime(current)} / {duration ? formatTime(duration) : "--:--"}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-[#c98fd8]">
          <span style={playing ? { animationDelay: "0s" } : undefined} className={playing ? "eq-bar inline-block" : ""}>♥</span>
          <span>♥</span>
          <span>♥</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- pastel candy controls ---------- */

/* round lavender transport buttons; the play/pause one is larger and centered */
function CircleButton({
  children,
  label,
  onClick,
  disabled,
  size,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  size: "sm" | "lg";
}) {
  const dims = size === "lg" ? "h-16 w-16" : "h-11 w-11";
  const icon = size === "lg" ? "h-6 w-6" : "h-4 w-4";
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => jiggle(e, onClick)}
      onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
      className={`pixel-btn flex ${dims} items-center justify-center rounded-full border-[3px] border-[#caa9e0] bg-[#f7ecfb] text-[#a777c6] shadow-[0_3px_0_#caa9e0] disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span className={icon}>{children}</span>
    </button>
  );
}

/* ---------- shared helpers & icons ---------- */

function jiggle(e: React.MouseEvent<HTMLButtonElement>, onClick: () => void) {
  const el = e.currentTarget;
  el.classList.remove("animate-jiggle");
  void el.offsetWidth; // reflow so the animation can re-fire on rapid clicks
  el.classList.add("animate-jiggle");
  onClick();
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path d="M5 3 L21 12 L5 21 Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <rect x="5" y="4" width="5" height="16" fill="currentColor" />
      <rect x="14" y="4" width="5" height="16" fill="currentColor" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <rect x="3" y="5" width="3.5" height="14" fill="currentColor" />
      <path d="M21 5 L9 12 L21 19 Z" fill="currentColor" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <path d="M3 5 L15 12 L3 19 Z" fill="currentColor" />
      <rect x="17.5" y="5" width="3.5" height="14" fill="currentColor" />
    </svg>
  );
}
