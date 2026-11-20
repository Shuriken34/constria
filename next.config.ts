import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site static: `npm run build` produce folderul `out/`, gata de urcat pe Hostinger (public_html).
  output: "export",
  trailingSlash: true,
  images: {
    // Fotografiile de prezentare vin de pe Pexels și sunt redimensionate de serverul lor.
    // Când ai poze cu lucrările voastre, pune-le în /public.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
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
