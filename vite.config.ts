import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { fetchKalshiPreview } from "./api/dflow/_kalshi";

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

  // Dev stand-in for api/dflow/prediction.ts: adds DFLOW_API_KEY server-side so it never
  // reaches the browser. Without a key it answers like the real endpoint does.
  const predictionDevProxy = {
    name: "dflow-prediction-dev-proxy",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use("/api/dflow/prediction", async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(body));
        };
        const key = env.DFLOW_API_KEY;
        const params = new URLSearchParams((req.url ?? "").split("?")[1] ?? "");
        const path = params.get("path") ?? "";
        params.delete("path");
        const allowed =
          /^\/api\/v1\/(events|tags_by_categories|series|market\/by-mint\/[1-9A-HJ-NP-Za-km-z]{32,44})$/;
        if (!allowed.test(path)) return send(400, { error: "Path not allowed" });
        const isEvents = path === "/api/v1/events";
        // No key (or a rejected one): read-only Kalshi preview, same as the Vercel function.
        if (!key) {
          if (!isEvents) {
            return send(503, {
              code: "no_api_key",
              error: "Prediction markets need DFLOW_API_KEY in your .env file.",
            });
          }
          try {
            return send(200, await fetchKalshiPreview());
          } catch {
            return send(502, { error: "Failed to reach the market data provider" });
          }
        }
        try {
          const up = await fetch(`https://prediction-markets-api.dflow.net${path}?${params}`, {
            headers: { "x-api-key": key },
          });
          if (up.status === 401 || up.status === 403) {
            if (isEvents) return send(200, await fetchKalshiPreview());
            return send(502, { code: "key_rejected", error: "DFlow rejected the API key." });
          }
          res.statusCode = up.status;
          res.setHeader("Content-Type", up.headers.get("content-type") ?? "application/json");
          res.end(await up.text());
        } catch {
          send(502, { error: "Failed to reach DFlow" });
        }
      });
    },
  };

  return {
    build: {
      sourcemap: false,
    },
    plugins: [
      react(),
      predictionDevProxy,
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
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB — covers jupiter-logo (2.44 MB) and solana-logo (2.1 MB)
          globPatterns: ["**/*.{js,css,html,png,ico,woff2}"],
          navigateFallback: "index.html",
          importScripts: ["sw-push.js"],
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
