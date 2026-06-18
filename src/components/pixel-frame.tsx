"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { PixelHeart } from "@/components/pixel-art";

/**
 * The chunky stair-stepped pixel border, drawn as overlay bars + corner squares
 * (same technique 8bitcn uses for its buttons). Sits inside a `relative` parent.
 */
export function PixelBorder({ t = 6 }: { t?: number }) {
  const bar = "absolute bg-foreground pointer-events-none";
  const px = `${t}px`;
  return (
    <>
      {/* edges, inset from the corners so the corners look notched */}
      <span className={bar} style={{ top: -t, left: t, right: t, height: px }} />
      <span className={bar} style={{ bottom: -t, left: t, right: t, height: px }} />
      <span className={bar} style={{ left: -t, top: t, bottom: t, width: px }} />
      <span className={bar} style={{ right: -t, top: t, bottom: t, width: px }} />
      {/* corner squares */}
      <span className={bar} style={{ top: 0, left: 0, width: px, height: px }} />
      <span className={bar} style={{ top: 0, right: 0, width: px, height: px }} />
      <span className={bar} style={{ bottom: 0, left: 0, width: px, height: px }} />
      <span className={bar} style={{ bottom: 0, right: 0, width: px, height: px }} />
    </>
  );
}

export interface PixelFrameProps {
  src?: string;
  alt?: string;
  caption?: string;
  /** mat / placeholder tint */
  tint?: string;
  className?: string;
  /** true for the photos above the fold — they load eagerly (no lazy delay) */
  priority?: boolean;
}

/**
 * A polaroid-ish 8-bit photo frame: cream mat, pixel border, hard drop shadow
 * and a retro caption. Gracefully shows a cute placeholder when the image is
 * missing or hasn't been added yet, so the gallery looks complete out of the box.
 */
export function PixelFrame({
  src,
  alt = "",
  caption,
  tint = "#ffe3f1",
  className,
  priority = false,
}: PixelFrameProps) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <figure
      className={cn(
        "relative select-none bg-cream p-3 pixel-box-shadow",
        className
      )}
    >
      {/* image / placeholder window */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ backgroundColor: tint }}
      >
        {/* placeholder always sits behind; the photo fades in once it loads */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <PixelHeart pixel={7} color="#ff85b3" highlight="#fff" />
          <span className="retro text-[10px] text-primary/70">ADD PHOTO</span>
        </div>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            // Photos are ~1 col on phones, 2 on tablets, 3 on desktop (max-w-4xl).
            // This lets Next serve a tiny, correctly-sized image per device
            // instead of the multi-megabyte original.
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
            quality={70}
            priority={priority}
            loading={priority ? undefined : "lazy"}
            onLoad={() => setLoaded(true)}
            style={{ imageRendering: "auto" }}
            className={cn(
              "relative block object-cover transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
            draggable={false}
          />
        ) : null}
      </div>

      {/* caption strip */}
      {caption ? (
        <figcaption className="retro mt-3 px-1 text-center text-[10px] leading-relaxed text-primary sm:text-[11px]">
          {caption}
        </figcaption>
      ) : (
        <div className="h-2" />
      )}

      <PixelBorder t={6} />
    </figure>
  );
}
