import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  images: {
    remotePatterns: [
      // Tokopedia
      {
        protocol: "https",
        hostname: "images.tokopedia.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "p16-images-sign-sg.tokopedia-static.net",
        pathname: "/**",
      },

      // Shopee
      {
        protocol: "https",
        hostname: "down-id.img.susercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cf.shopee.co.id",
        pathname: "/**",
      },

      // Blibli
      {
        protocol: "https",
        hostname: "www.static-src.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
