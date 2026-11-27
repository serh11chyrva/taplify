import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep reflection-sensitive libraries outside the server bundle.
  serverExternalPackages: ["mongoose", "@typegoose/typegoose"],
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/p/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "Content-Security-Policy", value: "frame-src https://www.youtube-nocookie.com https://open.spotify.com; object-src 'none'; base-uri 'self'" },
      ],
    }];
  },
  async redirects() {
    return [{ source: "/login", destination: "/sign-in", permanent: true }];
  },
};

export default nextConfig;
