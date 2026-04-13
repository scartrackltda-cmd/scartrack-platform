/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — required for optimized Docker/VPS deployment
  output: "standalone",

  // Keep Prisma server-side only (not bundled into client)
  serverExternalPackages: ["@prisma/client", "prisma"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },

  // Suppress noisy webpack warnings from socket.io optional binaries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push({
        "utf-8-validate": "commonjs utf-8-validate",
        bufferutil: "commonjs bufferutil",
      });
    }
    return config;
  },

  // Security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "SAMEORIGIN"            },
          { key: "X-Content-Type-Options",     value: "nosniff"               },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
