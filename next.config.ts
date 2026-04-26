import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 has native bindings and must not be bundled.
  serverExternalPackages: ["better-sqlite3"],

  // Emit .next/standalone for a minimal Docker/self-host build.
  // Copy public/ and .next/static/ into it after build — see Dockerfile.
  output: "standalone",

  // Shrink exposed info in headers.
  poweredByHeader: false,

  // Security headers for all routes. Anyone serving behind a CDN can still add
  // HSTS/CSP on top.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
