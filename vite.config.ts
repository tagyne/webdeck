import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    VitePWA({
      outDir: "build/client",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "Webdeck OBS Controller",
        short_name: "Webdeck",
        description: "A local-first OBS control deck for phones and tablets.",
        theme_color: "#111827",
        background_color: "#f4efe6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/webdeck-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/webdeck-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          }
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 4173,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
