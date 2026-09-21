import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zctaukyrhsmpjkcddcqq.supabase.co",
        pathname: "/storage/v1/object/public/tienda-fotos/**",
      },
      {
        protocol: "https",
        hostname: "cdn.catalog-store.link",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
