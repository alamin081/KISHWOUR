import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // The PDF route reads the logo from disk; make sure it is bundled with the function.
  outputFileTracingIncludes: { "/catalog.pdf": ["./public/brand/kishwour-logo.png"] },
  images: {
    formats: ["image/avif", "image/webp"],
    // Keep optimised images for 60 seconds so a newly-published Cloudinary photo
    // appears on the site quickly (the browser revalidates after minimumCacheTTL).
    minimumCacheTTL: 60,
    remotePatterns: [
      // Product and category media are served from Cloudinary.
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async redirects() {
    return [
      // Category pages moved from /categories/<slug> to /products/<slug>.
      { source: "/categories/:slug", destination: "/products/:slug", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
