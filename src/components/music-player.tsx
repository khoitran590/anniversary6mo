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

  return (
    <div
      /* NES.css design language: flat teal, square corners, chunky ink border
         and a hard pixel drop-shadow — no gradients, no soft shadows */
      className="pixel-box-shadow relative mx-auto w-full max-w-[360px] select-none border-4 border-[#2d2a4a] bg-[#19c1d6] px-5 pb-7 pt-5 sm:px-6"
    >
      {/* ===== screen bezel (flat dark plastic around the LCD) ===== */}
      <div className="border-4 border-[#2d2a4a] bg-[#2d2a4a] px-4 pb-3 pt-4">
        {/* power LED + "POWER" caption — a blocky pixel, not a glowing dot */}
        <div className="mb-2 flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 ${
              playing ? "bg-[#e76e55]" : "bg-[#7a2f2f]"
            }`}
          />
          <span className="text-[6px] font-bold tracking-[0.2em] text-[#9a93b0]">
            POWER
          </span>
        </div>

        {/* ===== the LCD screen — flat greenish Game Boy panel ===== */}
        <div className="overflow-hidden border-4 border-[#1b1825] bg-[#9bbc4f] px-3 py-3 text-[#1b3a1b]">
          {source ? (
            <>
              {/* now playing + bouncing equalizer */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold tracking-[0.18em]">
                  ♪ NOW PLAYING
                </span>
                <div className="flex h-3 items-end gap-[2px]">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-[3px] bg-[#1b3a1b] ${playing ? "eq-bar" : ""}`}
                      style={{
                        height: "100%",
                        animationDelay: `${i * 0.12}s`,
                        transform: playing ? undefined : "scaleY(0.25)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* current song title — scrolls if it overflows the screen */}
              <div className="mt-1.5 overflow-hidden whitespace-nowrap">
                {title.length > 28 ? (
                  <div className="animate-marquee inline-block">
                    <span className="text-[10px] font-bold">{title}</span>
                    <span className="px-6 text-[10px] font-bold">{title}</span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold">
                    {title || "loading…"}
                  </span>
                )}
              </div>

              {/* seek bar drawn as a chunky LCD progress meter */}
              <div
                role="slider"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                tabIndex={0}
                onClick={seek}
                className="mt-3 h-3 w-full cursor-pointer border-[3px] border-[#1b3a1b] bg-[#88aa44]"
              >
                <div
                  className="h-full bg-[#1b3a1b]"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-1.5 flex justify-between text-[9px] font-bold tabular-nums">
                <span>{formatTime(current)}</span>
                <span>{duration ? formatTime(duration) : "--:--"}</span>
              </div>
            </>
          ) : (
            <p className="py-2 text-center text-[9px] font-bold leading-relaxed">
              INSERT A SONG ♥<br />
              paste a YouTube link to play
            </p>
          )}
        </div>

        {/* the colorful "GAME BOY COLOR" wordmark below the screen */}
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-extrabold italic tracking-tight">
          <span className="text-[#e8e4ec]">YOUR MUSIC</span>
          <span className="text-[#ff5f8d]">C</span>
          <span className="text-[#ffd23f]">O</span>
          <span className="text-[#4fd1ff]">L</span>
          <span className="text-[#8aff6a]">O</span>
          <span className="text-[#ff5f8d]">R</span>
        </div>
      </div>

      {/* ===== controls deck ===== */}
      {!minimized && (
        <div className="mt-6 flex items-start justify-between">
          {/* D-pad — left/right step tracks, A is play */}
          <DPad
            ready={ready}
            onPrev={() => player?.previousVideo()}
            onNext={() => player?.nextVideo()}
          />

          {/* A / B round buttons, set on the diagonal like the real console */}
          <div className="flex -translate-y-1 items-end gap-3">
            <RoundButton
              label="Minimize player"
              variant="is-error"
              disabled={false}
              onClick={() => setMinimized(true)}
              letter="B"
            >
              <StopIcon />
            </RoundButton>
            <RoundButton
              label={playing ? "Pause" : "Play"}
              variant="is-success"
              disabled={!ready}
              onClick={togglePlay}
              letter="A"
              className="-translate-y-3"
            >
              {playing ? <PauseIcon /> : <PlayIcon />}
            </RoundButton>
          </div>
        </div>
      )}

      {/* restore handle when minimized */}
      {minimized && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setMinimized(false)}
            className="nes-btn pixel-btn !text-[8px] !tracking-widest"
          >
            ▲ OPEN
          </button>
        </div>
      )}

      {/* START / SELECT pills */}
      <div className="mt-6 flex items-center justify-center gap-5">
        <PillButton
          label="Previous track"
          disabled={!ready}
          onClick={() => player?.previousVideo()}
          caption="SELECT"
        />
        <PillButton
          label="Next track"
          disabled={!ready}
          onClick={() => player?.nextVideo()}
          caption="START"
        />
      </div>

      {/* speaker grille — blocky square pixels, bottom-right like the GBC */}
      <div className="mt-4 ml-auto grid w-fit grid-cols-5 gap-[5px]">
        {Array.from({ length: 15 }).map((_, i) => (
          <span key={i} className="h-1 w-1 bg-[#2d2a4a]" />
        ))}
      </div>

      {/* hidden YouTube engine (audio only — controls live above) */}
      {source && (
        <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
          <div ref={holderRef} />
        </div>
      )}
    </div>
  );
}

/* ---------- Game Boy controls ---------- */

function jiggle(e: React.MouseEvent<HTMLButtonElement>, onClick: () => void) {
  const el = e.currentTarget;
  el.classList.remove("animate-jiggle");
  void el.offsetWidth; // reflow so the animation can re-fire on rapid clicks
  el.classList.add("animate-jiggle");
  onClick();
}

/* directional pad. Up/down are decorative; left = prev, right = next. */
function DPad({
  onPrev,
  onNext,
  ready,
}: {
  onPrev: () => void;
  onNext: () => void;
  ready: boolean;
}) {
  const arm = "absolute bg-[#2d2a4a]";
  return (
    <div className="relative h-[78px] w-[78px]">
      {/* vertical + horizontal arms — flat squared cross */}
      <div className={`${arm} left-1/2 top-0 h-full w-[26px] -translate-x-1/2`} />
      <div className={`${arm} top-1/2 left-0 h-[26px] w-full -translate-y-1/2`} />
      {/* center dimple */}
      <div className="absolute left-1/2 top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 bg-[#1f1c2a]" />

      {/* left = previous */}
      <button
        type="button"
        aria-label="Previous track"
        disabled={!ready}
        onClick={(e) => jiggle(e, onPrev)}
        onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
        className="pixel-btn absolute top-1/2 left-0 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center text-[#cfc9dd] disabled:opacity-40"
      >
        <PrevIcon />
      </button>
      {/* right = next */}
      <button
        type="button"
        aria-label="Next track"
        disabled={!ready}
        onClick={(e) => jiggle(e, onNext)}
        onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
        className="pixel-btn absolute top-1/2 right-0 flex h-[26px] w-[26px] -translate-y-1/2 items-center justify-center text-[#cfc9dd] disabled:opacity-40"
      >
        <NextIcon />
      </button>
    </div>
  );
}

/* square A / B buttons built from NES.css `nes-btn` chips */
function RoundButton({
  children,
  label,
  letter,
  variant,
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  letter: string;
  variant: "is-success" | "is-error";
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={(e) => jiggle(e, onClick)}
        onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
        className={`nes-btn pixel-btn ${variant} !m-0 !flex !h-11 !w-11 items-center justify-center !p-0 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <span className="h-5 w-5 text-white">{children}</span>
      </button>
      <span className="text-[10px] font-extrabold italic text-[#0c5566]">
        {letter}
      </span>
    </div>
  );
}

/* flat START / SELECT pills — squared blocks, no gloss */
function PillButton({
  label,
  caption,
  onClick,
  disabled,
}: {
  label: string;
  caption: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex -rotate-[20deg] flex-col items-center gap-1">
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        onClick={(e) => jiggle(e, onClick)}
        onAnimationEnd={(e) => e.currentTarget.classList.remove("animate-jiggle")}
        className="pixel-btn h-3 w-9 border-2 border-[#1f1c2a] bg-[#2d2a4a] disabled:opacity-40"
      />
      <span className="text-[6px] font-bold tracking-[0.15em] text-[#0c5566]">
        {caption}
      </span>
    </div>
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

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
      <rect x="6" y="6" width="12" height="12" fill="currentColor" />
    </svg>
  );
}
