import type { Metadata, Viewport } from "next";
import { Press_Start_2P, Pixelify_Sans } from "next/font/google";
import Script from "next/script";
// NES.css is imported inside globals.css into a dedicated cascade layer so its
// Bootstrap-Reboot reset can't override Tailwind utilities (e.g. `flex`).
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Happy Anniversary My Princess 👑",
  description: "A little 8-bit love letter for our anniversary.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // allow pinch-zoom for accessibility; cap to avoid accidental huge zoom
  maximumScale: 5,
  themeColor: "#ffd1e6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html
      lang="en"
      className={`${pressStart.variable} ${pixelify.variable} h-full antialiased`}
    >
      <head>
        {mapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
