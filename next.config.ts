import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep reflection-sensitive libraries outside the server bundle.
  serverExternalPackages: ["mongoose", "@typegoose/typegoose"],
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/login", destination: "/sign-in", permanent: true }];
  },
};

export default nextConfig;
