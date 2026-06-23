import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "AvtoTest — Haydovchilik testlari",
        short_name: "AvtoTest",
        description: "O'zbekiston haydovchilik guvohnomasi testlari",
        theme_color: "#58cc02",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        lang: "uz",
        start_url: "/",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // cache remote question images (tezkoravtotest.uz)
            urlPattern: /^https:\/\/api\.tezkoravtotest\.uz\/upload\//,
            handler: "CacheFirst",
            options: {
              cacheName: "avtotest-images",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // cache Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: { cacheName: "avtotest-fonts", expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
