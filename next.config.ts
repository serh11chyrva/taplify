import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep reflection-sensitive libraries outside the server bundle.
  serverExternalPackages: ["mongoose", "@typegoose/typegoose"],
  poweredByHeader: false,
};

export default nextConfig;
