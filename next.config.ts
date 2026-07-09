import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Imported products (via spreadsheet/Sheets) can reference any external image URL.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
