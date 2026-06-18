import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tiny helper that turns an ASCII grid into crisp pixel-art SVG.
 * Each character maps to a fill colour (or nothing, when the char is absent
 * from `colors`). Rendered with shape-rendering="crispEdges" so it stays sharp
 * at any scale — true to the 8-bit look.
 */
export interface PixelArtProps extends React.SVGProps<SVGSVGElement> {
  grid: string[];
  colors: Record<string, string>;
  /** rendered size of a single source pixel, in px */
  pixel?: number;
}

export function PixelArt({
  grid,
  colors,
  pixel = 6,
  className,
  ...props
}: PixelArtProps) {
  const rows = grid.length;
  const cols = Math.max(...grid.map((r) => r.length));

  return (
    <svg
      width={cols * pixel}
      height={rows * pixel}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      className={cn("pixelated", className)}
      aria-hidden="true"
      {...props}
    >
      {grid.flatMap((row, y) =>
        [...row].map((ch, x) => {
          const fill = colors[ch];
          if (!fill) return null;
          return (
            <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />
          );
        })
      )}
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Named sprites
--------------------------------------------------------------------------- */

const HEART = [
  ".XX..XX.",
  "XoXXXXoX",
  "XXXXXXXX",
  "XXXXXXXX",
  ".XXXXXX.",
  "..XXXX..",
  "...XX...",
];

export function PixelHeart({
  color = "#ff4f8b",
  highlight = "#ffd0e2",
  pixel = 6,
  className,
  ...props
}: {
  color?: string;
  highlight?: string;
} & Omit<PixelArtProps, "grid" | "colors">) {
  return (
    <PixelArt
      grid={HEART}
      colors={{ X: color, o: highlight }}
      pixel={pixel}
      className={className}
      {...props}
    />
  );
}

const SPARKLE = [
  "..X..",
  ".XXX.",
  "XXXXX",
  ".XXX.",
  "..X..",
];

export function PixelSparkle({
  color = "#ffe27a",
  pixel = 6,
  className,
  ...props
}: { color?: string } & Omit<PixelArtProps, "grid" | "colors">) {
  return (
    <PixelArt
      grid={SPARKLE}
      colors={{ X: color }}
      pixel={pixel}
      className={className}
      {...props}
    />
  );
}

const STAR = [
  "...X...",
  "...X...",
  ".XXXXX.",
  "XXXXXXX",
  ".XXXXX.",
  ".XX.XX.",
  "X.....X",
];

export function PixelStar({
  color = "#ffe27a",
  pixel = 6,
  className,
  ...props
}: { color?: string } & Omit<PixelArtProps, "grid" | "colors">) {
  return (
    <PixelArt
      grid={STAR}
      colors={{ X: color }}
      pixel={pixel}
      className={className}
      {...props}
    />
  );
}

const CROWN = [
  "X...X...X",
  "XX.XXX.XX",
  "XXXXXXXXX",
  "XGXXGXXGX",
  "XXXXXXXXX",
  ".XXXXXXX.",
];

export function PixelCrown({
  color = "#ffcf3f",
  gem = "#ff4f8b",
  pixel = 6,
  className,
  ...props
}: {
  color?: string;
  gem?: string;
} & Omit<PixelArtProps, "grid" | "colors">) {
  return (
    <PixelArt
      grid={CROWN}
      colors={{ X: color, G: gem }}
      pixel={pixel}
      className={className}
      {...props}
    />
  );
}

// a little side-view lily: pink bloom, yellow stamen, green stem + leaves
const LILY = [
  ".p..p..p.",
  ".pp.p.pp.",
  ".ppppppp.",
  "ppppppppp",
  "pppYpYppp",
  ".pppYppp.",
  "..ppppp..",
  "...ppp...",
  "....G....",
  "..g.G.g..",
  ".gg.G.gg.",
  "..ggGgg..",
  "....G....",
  "....G....",
];

export function PixelLily({
  petal = "#ff8fc0",
  stamen = "#ffd84d",
  stem = "#4fae6f",
  leaf = "#79cf95",
  pixel = 6,
  className,
  ...props
}: {
  petal?: string;
  stamen?: string;
  stem?: string;
  leaf?: string;
} & Omit<PixelArtProps, "grid" | "colors">) {
  return (
    <PixelArt
      grid={LILY}
      colors={{ p: petal, Y: stamen, G: stem, g: leaf }}
      pixel={pixel}
      className={className}
      {...props}
    />
  );
}
