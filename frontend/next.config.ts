
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  basePath: "/itops-ai",

  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  cacheComponents: false,

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
