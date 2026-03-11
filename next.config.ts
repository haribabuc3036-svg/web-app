import type { NextConfig } from "next";

// BACKEND_URL is a private env var (no NEXT_PUBLIC prefix) used only for
// server-side rewrites. Set it in Vercel → Settings → Environment Variables.
// e.g. https://tirumala-backend.up.railway.app
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* calls through Next.js so the Set-Cookie response
        // lands on the Vercel domain (not the backend domain). This allows
        // the middleware to read the auth cookie correctly.
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Cloudinary (wallpapers, place photos, service images, SSD location images)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Supabase Storage (if any assets are served from there)
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
