import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/* Pages pubblica i progetti sotto il nome della repo, non in radice: senza base
   gli asset verrebbero cercati in / e risponderebbero 404. Deve combaciare con
   il nome della repo su GitHub. */
const base = "/gym-buddy/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "icon-180.png", "icon-192.png", "icon-512.png"],
      scope: base,
      manifest: {
        name: "GYM BUDDY",
        short_name: "GYM BUDDY",
        description: "Scheda forza, energia, soddisfazione e storico allenamenti",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        scope: base,
        start_url: base,
        icons: [
          /* L'SVG resta per Android/Chrome moderni; i PNG sono per Safari su
             iPhone, che per l'icona della schermata Home non legge il manifest
             per niente e vuole solo <link rel="apple-touch-icon"> in index.html
             — ma un secondo lettore del manifest (o un Android più vecchio)
             trova comunque una taglia raster valida qui. */
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
