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

  const source = playlist ? parseSource(playlist) : null;
  const sourceKey = source ? `${source.kind}:${source.id}` : "";

  useEffect(() => {
    if (!source || !holderRef.current) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !holderRef.current) return;
      playerRef.current = new YT.Player(holderRef.current, {
        width: "320",
        height: "180",
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
        },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
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

  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-[14px] border-[5px] border-[#a9d8cc] bg-[#efe9d5] shadow-[6px_6px_0_0_rgba(45,42,74,0.25)]"
    >
      {/* title bar */}
      <div className="flex items-center justify-between gap-2 border-b-[3px] border-[#a9d8cc] px-3 py-2">
        <span className="text-sm font-bold text-[#2d2a4a] sm:text-base">
          Your music
        </span>
        <div className="flex items-center gap-3 text-[#2d2a4a]">
          <button
            type="button"
            aria-label={minimized ? "Restore player" : "Minimize player"}
            onClick={() => setMinimized((m) => !m)}
            className="pixel-btn leading-none"
          >
            <WindowGlyph kind="min" />
          </button>
          <span aria-hidden className="opacity-70">
            <WindowGlyph kind="max" />
          </span>
          <button
            type="button"
            aria-label="Minimize player"
            onClick={() => setMinimized(true)}
            className="pixel-btn leading-none"
          >
            <WindowGlyph kind="close" />
          </button>
        </div>
      </div>

      {/* body — hidden when "minimized", music keeps playing */}
      {!minimized && (
        <div className="px-5 py-6 sm:px-8 sm:py-7">
          {/* transport controls */}
          <div className="mb-6 flex items-center justify-center gap-7">
            <TransportButton
              label="Previous track"
              disabled={!ready}
              onClick={() => player?.previousVideo()}
            >
              <PrevIcon />
            </TransportButton>

            <TransportButton
              label={playing ? "Pause" : "Play"}
              disabled={!ready}
              onClick={togglePlay}
              big
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </TransportButton>

            <TransportButton
              label="Next track"
              disabled={!ready}
              onClick={() => player?.nextVideo()}
            >
              <NextIcon />
            </TransportButton>
          </div>

          {/* seek bar */}
          <div className="flex items-center gap-3">
            <div
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(current)}
              tabIndex={0}
              onClick={seek}
              className="group relative h-3 flex-1 cursor-pointer rounded-full bg-[#d6cfb4]"
            >
              {/* filled portion */}
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[#2d2a4a]"
                style={{ width: `${pct}%` }}
              />
              {/* knob */}
              <div
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#2d2a4a] bg-[#efe9d5] shadow-sm transition-transform group-hover:scale-110"
                style={{ left: `${pct}%` }}
              />
            </div>
          </div>

          {/* time / hint line */}
          <div className="mt-2 flex justify-between text-[10px] text-[#2d2a4a]/70">
            {source ? (
              <>
                <span>{formatTime(current)}</span>
                <span>{duration ? formatTime(duration) : "--:--"}</span>
              </>
            ) : (
              <span className="mx-auto text-center">
                paste your YouTube song or playlist link to play 💌
              </span>
            )}
          </div>
        </div>
      )}

      {/* hidden YouTube engine (audio only — controls live above) */}
      {source && (
        <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
          <div ref={holderRef} />
        </div>
      )}
    </div>
  );
}

/* ---------- transport button + icons ---------- */

function TransportButton({
  children,
  label,
  onClick,
  disabled,
  big = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  big?: boolean;
}) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget;
    el.classList.remove("animate-jiggle");
    void el.offsetWidth; // reflow so the animation can re-fire on rapid clicks
    el.classList.add("animate-jiggle");
    onClick();
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
      className={`pixel-btn inline-flex items-center justify-center text-[#2d2a4a] disabled:cursor-not-allowed disabled:opacity-40 ${
        big ? "h-12 w-12" : "h-9 w-9"
      }`}
    >
      {children}
    </button>
  );
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

/* tiny window-chrome glyphs: _  □  × */
function WindowGlyph({ kind }: { kind: "min" | "max" | "close" }) {
  if (kind === "min") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <rect x="3" y="11" width="10" height="2.5" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "max") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
        <rect
          x="3"
          y="3"
          width="10"
          height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden>
      <path
        d="M4 4 L12 12 M12 4 L4 12"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
