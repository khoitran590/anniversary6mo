"use client";

import * as React from "react";

import { Button } from "@/components/ui/8bit/button";
import { cn } from "@/lib/utils";

/** how close (px) the cursor may get before the button flees */
const THRESHOLD = 110;
/** keep the button this far from every viewport edge when it teleports */
const EDGE_MARGIN = 24;

interface DodgeButtonProps {
  children: React.ReactNode;
  className?: string;
  /** fired every time the button successfully dodges the cursor */
  onDodge?: (count: number) => void;
}

export function DodgeButton({ children, className, onDodge }: DodgeButtonProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  // the button's resting position/size in viewport coords (offset === 0)
  const homeRef = React.useRef<{
    left: number;
    top: number;
    w: number;
    h: number;
  } | null>(null);
  const offsetRef = React.useRef({ x: 0, y: 0 });
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dodgeCount = React.useRef(0);

  // Capture the resting (un-transformed) position. We derive it from the live
  // rect minus the currently-applied offset, so it stays correct even if the
  // layout shifts — but we never read the rect mid-flee, which would be
  // mid-CSS-transition and give a wrong (interpolated) value.
  const measureHome = React.useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    homeRef.current = {
      left: rect.left - offsetRef.current.x,
      top: rect.top - offsetRef.current.y,
      w: rect.width,
      h: rect.height,
    };
  }, []);

  React.useEffect(() => {
    measureHome();
    const onResize = () => {
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
      // re-measure after the reset paints
      requestAnimationFrame(measureHome);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measureHome]);

  const flee = React.useCallback(
    (cursorX: number, cursorY: number) => {
      const home = homeRef.current;
      if (!home || typeof window === "undefined") return;

      const { w, h } = home;
      const maxLeft = window.innerWidth - w - EDGE_MARGIN;
      const maxTop = window.innerHeight - h - EDGE_MARGIN;

      // pick a random landing spot that's safely away from the cursor
      let targetLeft = home.left;
      let targetTop = home.top;
      for (let i = 0; i < 16; i++) {
        const candLeft =
          EDGE_MARGIN + Math.random() * Math.max(1, maxLeft - EDGE_MARGIN);
        const candTop =
          EDGE_MARGIN + Math.random() * Math.max(1, maxTop - EDGE_MARGIN);
        targetLeft = candLeft;
        targetTop = candTop;
        const dist = Math.hypot(
          cursorX - (candLeft + w / 2),
          cursorY - (candTop + h / 2)
        );
        if (dist > THRESHOLD * 2.2) break;
      }

      const next = { x: targetLeft - home.left, y: targetTop - home.top };
      offsetRef.current = next;
      setOffset(next);
      dodgeCount.current += 1;
      onDodge?.(dodgeCount.current);
    },
    [onDodge]
  );

  // chase detection: if the cursor wanders within range, run away
  React.useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < THRESHOLD) {
        flee(e.clientX, e.clientY);
      }
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [flee]);

  // touch / direct-tap fallback (no hover on mobile)
  const handleTouch = (e: React.TouchEvent) => {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (t) flee(t.clientX, t.clientY);
  };

  return (
    <div
      ref={wrapperRef}
      onTouchStart={handleTouch}
      onClick={(e) => {
        // if they somehow land a click, dodge instead of doing anything
        e.preventDefault();
        flee(e.clientX, e.clientY);
      }}
      className="inline-block will-change-transform transition-transform duration-150 ease-out"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <Button
        type="button"
        size="lg"
        tabIndex={-1}
        aria-label="Not ready yet (this button keeps running away)"
        className={cn(
          "retro bg-rose text-primary-foreground text-base md:text-lg px-7 py-6 cursor-not-allowed",
          className
        )}
      >
        {children}
      </Button>
    </div>
  );
}
