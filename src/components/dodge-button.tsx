"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** how close (px) the cursor may get before the button flees */
const THRESHOLD = 100;
/** keep the button this far from every viewport edge when it teleports */
const EDGE_MARGIN = 24;

interface DodgeButtonProps {
  children: React.ReactNode;
  className?: string;
  /** fired every time the button successfully dodges the cursor */
  onDodge?: (count: number) => void;
  /** ID of a DOM element to avoid overlapping (e.g., the Game Boy container) */
  avoidId?: string;
}

export function DodgeButton({ children, className, onDodge, avoidId }: DodgeButtonProps) {
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

      // Get the bounding box of the element we want to avoid
      let avoidRect: DOMRect | null = null;
      if (avoidId) {
        const avoidEl = document.getElementById(avoidId);
        if (avoidEl) {
          avoidRect = avoidEl.getBoundingClientRect();
        }
      }

      let targetLeft = home.left;
      let targetTop = home.top;
      
      // Increased to 50 attempts since avoiding a large central element 
      // narrows down the safe zones significantly.
      for (let i = 0; i < 50; i++) {
        const candLeft = EDGE_MARGIN + Math.random() * Math.max(1, maxLeft - EDGE_MARGIN);
        const candTop = EDGE_MARGIN + Math.random() * Math.max(1, maxTop - EDGE_MARGIN);
        
        targetLeft = candLeft;
        targetTop = candTop;

        // 1. Check cursor distance
        const distToCursor = Math.hypot(
          cursorX - (candLeft + w / 2),
          cursorY - (candTop + h / 2)
        );
        const isSafeFromCursor = distToCursor > THRESHOLD * 2.2;

        // 2. Check collision with the avoidance element (Game Boy)
        let isOverlappingAvoid = false;
        if (avoidRect) {
          const buttonRight = candLeft + w;
          const buttonBottom = candTop + h;
          // Add a 20px padding around the Game Boy so it doesn't sit right on the edge
          const pad = 20;

          isOverlappingAvoid = !(
            buttonRight < avoidRect.left - pad ||
            candLeft > avoidRect.right + pad ||
            buttonBottom < avoidRect.top - pad ||
            candTop > avoidRect.bottom + pad
          );
        }

        // If it's safe from the cursor AND not overlapping the Game Boy, we found our spot!
        if (isSafeFromCursor && !isOverlappingAvoid) {
          break;
        }
      }

      const next = { x: targetLeft - home.left, y: targetTop - home.top };
      offsetRef.current = next;
      setOffset(next);
      dodgeCount.current += 1;
      onDodge?.(dodgeCount.current);
    },
    [onDodge, avoidId]
  );

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

  const handleTouch = (e: React.TouchEvent) => {
    const t = e.touches[0] ?? e.changedTouches[0];
    if (t) flee(t.clientX, t.clientY);
  };

  return (
    <div
      ref={wrapperRef}
      onTouchStart={handleTouch}
      onClick={(e) => {
        e.preventDefault();
        flee(e.clientX, e.clientY);
      }}
      className="inline-block will-change-transform transition-transform duration-150 ease-out"
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Not ready yet (this button keeps running away)"
        className={cn(className)}
      >
        {children}
      </button>
    </div>
  );
}