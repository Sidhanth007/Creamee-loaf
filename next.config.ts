import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the floating dev-tools badge during development
  devIndicators: false,
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Allow cake reference-image uploads up to ~5MB plus multipart overhead.
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
