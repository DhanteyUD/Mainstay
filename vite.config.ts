import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sentryDsn = env.VITE_SENTRY_DSN;

  let sentryTunnelProxy = {};
  if (sentryDsn) {
    const dsn = new URL(sentryDsn);
    const projectId = dsn.pathname.slice(1);
    sentryTunnelProxy = {
      "/api/sentry-tunnel": {
        target: `${dsn.protocol}//${dsn.host}`,
        changeOrigin: true,
        rewrite: () => `/api/${projectId}/envelope/`,
      },
    };
  }

  return {
    build: {
      sourcemap: false,
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "favicon-16x16.png",
          "favicon-32x32.png",
          "apple-touch-icon.png",
          "android-chrome-192x192.png",
          "android-chrome-512x512.png",
        ],
        manifest: {
          name: "Mainstay",
          short_name: "Mainstay",
          description: "Protected swaps powered by Mainstay",
          theme_color: "#0f0f1a",
          background_color: "#0f0f1a",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,ico,woff2}"],
          navigateFallback: "index.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
      sentryVitePlugin({
        org: env.SENTRY_ORG,
        project: env.SENTRY_PROJECT,
        authToken: env.SENTRY_AUTH_TOKEN,
        silent: true,
      }),
      nodePolyfills({
        include: ["buffer", "crypto", "stream", "util"],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    resolve: {
      dedupe: ["@solana/web3.js"],
    },
    define: {
      "process.env": {},
      global: "globalThis",
    },
    server: {
      proxy: sentryTunnelProxy,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      cors: true,
      allowedHosts: true,
    },
  };
});
