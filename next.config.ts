import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern, far-smaller formats when the browser supports them.
    formats: ["image/avif", "image/webp"],
    // Cache optimized variants for 30 days so repeat visits are instant.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
