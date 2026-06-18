# 👑 Happy Anniversary My Princess — an 8-bit love letter

A tiny two-page Next.js site with a retro **8-bit / pixel-art** theme, built with
[8bitcn](https://8bitcn.com) components on top of shadcn + Tailwind v4.

## Pages

| Route       | Vibe          | What's there |
|-------------|---------------|--------------|
| `/`         | 🌸 pastel pink | Big pixel title **"Happy Anniversary My Princess"**, a floating crown, hearts/stars, and two buttons: **READY** (takes you to the gallery) and **NOT READY** (runs away from your cursor and refuses to be clicked 😏). |
| `/gallery`  | 💙 pastel blue | Your photos **scattered across the floor**, each in a chunky 8-bit pixel frame with a hard drop-shadow and a retro caption. |

## Run it

```bash
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

Build for production:

```bash
pnpm build && pnpm start
```

## 📸 Add your photos

Drop images into `public/photos/` named `01.jpg … 11.jpg` and they'll fade into
the frames automatically. Until then each slot shows a cute **ADD PHOTO**
placeholder, so the page always looks complete.

- Square-ish images look best (the frame window is a square).
- Using `.png`/`.webp`? Just change the extensions in the `SLOTS` array.
- Want different captions, positions, rotations, sizes, or more/fewer photos?
  Edit `SLOTS` in [`src/app/gallery/page.tsx`](src/app/gallery/page.tsx).

## How the pieces fit

- **Fonts** — `Press Start 2P` (headings/buttons, via the `.retro` class) and
  `Pixelify Sans` (body), loaded with `next/font`.
- **Theme + pastel palette + pixel utilities** — `src/app/globals.css`.
- **8-bit components** — `src/components/ui/8bit/*` (from 8bitcn).
- **Pixel sprites** (heart, star, sparkle, crown) — `src/components/pixel-art.tsx`
  (ASCII grids rendered as crisp SVG).
- **Runaway button** — `src/components/dodge-button.tsx`.
- **Photo frame** — `src/components/pixel-frame.tsx`.

Made with 💖 and a lot of pixels.
