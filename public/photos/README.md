# 📸 Add your photos here

Drop your images into this folder and name them:

    01.jpg, 02.jpg, 03.jpg ... 11.jpg

They'll automatically appear inside the 8-bit frames on the /gallery page.

- Any web image format works — just change the extension in
  `src/app/gallery/page.tsx` if you use .png/.webp (e.g. `/photos/01.png`).
- Square-ish images look best (the frame window is a square).
- Until you add a file, that slot shows a cute "ADD PHOTO" placeholder.

Want more or fewer photos? Edit the `SLOTS` array in
`src/app/gallery/page.tsx` (positions, captions, rotation, size).
