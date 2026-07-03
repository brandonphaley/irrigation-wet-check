import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// SSC Wet Check — Vite config.
// Built as an installable PWA (works offline on phone/tablet/desktop).
// Structured so it can later be wrapped with Capacitor for the app stores
// without changing app code — Capacitor just loads this same web build.
export default defineConfig({
  // Relative base so the same build works from the local launcher (server root)
  // AND from GitHub Pages (served under /<repo-name>/).
  base: "./",
  // Stamped at build time; shown in Settings so anyone can tell at a glance
  // whether the device is running the latest build.
  define: {
    __BUILD_STAMP__: JSON.stringify(
      new Date().toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
      })
    ),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "SSC Wet Check",
        short_name: "Wet Check",
        description: "Irrigation wet check field inspections",
        theme_color: "#2b7a8c",
        background_color: "#fbfcfd",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
    }),
  ],
  server: {
    host: true, // expose on the local network so you can open it on a phone
    port: 5173,
  },
});
