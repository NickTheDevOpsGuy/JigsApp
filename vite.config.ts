/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from .env files AND process.env (Vercel injects here)
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseOrigin = (() => {
    const raw = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    try {
      return raw.trim() ? new URL(raw.trim()).origin : "";
    } catch {
      return "";
    }
  })();

  return {
    plugins: [
      react(),
      {
        name: "phuzzle-preconnect-supabase",
        transformIndexHtml(html) {
          if (!supabaseOrigin) return html;
          const links = `    <link rel="preconnect" href="${supabaseOrigin}" crossorigin />
    <link rel="dns-prefetch" href="${supabaseOrigin}" />`;
          return html.replace("</head>", `${links}\n  </head>`);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png", "og-image.png"],
        manifest: {
          name: "Phuzzle",
          short_name: "Phuzzle",
          description:
            "Solve beautiful jigsaw puzzles in your browser. Relax, race the clock, or play with a friend.",
          theme_color: "#0b63b8",
          background_color: "#f3f7ff",
          display: "standalone",
          display_override: ["standalone", "minimal-ui", "browser"],
          start_url: "/",
          scope: "/",
          id: "/",
          categories: ["games", "entertainment"],
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
          // Maps are not needed offline; skipping them shrinks precache and install cost.
          globIgnores: ["**/*.map"],
          cleanupOutdatedCaches: true,
          // Allow puzzle images up to ~50 MB (default 2 MiB fails on large sample images)
          maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        },
      }),
    ],
    test: {
      environment: "node",
      include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
      exclude: ["node_modules", "**/e2e/**"],
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
    },
    build: {
      // Single CSS bundle avoids "Unable to preload CSS for /assets/..." errors on Vercel.
      // Per-chunk CSS can fail when filenames are truncated or misresolved after deploy.
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Keep storage/time/daily helpers in stable shared chunks to avoid
            // cross-chunk initialization cycles (menu <-> play-setup).
            if (id.includes("utils/safeLocalStorage")) {
              return "storage";
            }
            if (id.includes("screens/Play/timeMode")) {
              return "time-mode";
            }
            if (id.includes("/daily/")) {
              return "daily";
            }
            if (id.includes("samplePuzzles") || id.includes("puzzlePacks")) {
              return "puzzles";
            }
            // Play helpers imported by Choose/Pack modals must not live in play-setup, or Rollup
            // reports a circular chunk: play-setup -> modals -> play-setup.
            if (id.includes("screens/Play/loadPlayScreen")) {
              return "play-shared";
            }
            if (
              id.includes("screens/Play/core/utils/playScreenUtils") &&
              !id.includes(".test")
            ) {
              return "play-shared";
            }
            // Screen chunks: use short names to avoid CSS preload failures.
            // Play + Menu in one chunk to avoid circular chunk warnings (e.g. play-setup <-> menu).
            if (id.includes("screens/Play") || id.includes("screens/Menu")) {
              return "play-setup";
            }
            if (id.includes("screens/Stats")) return "stats";
            if (id.includes("screens/Packs/PackListScreen")) return "pack-list";
            if (id.includes("screens/Packs/PackDetailScreen")) return "pack-detail";
            if (id.includes("screens/Packs/")) return "pack-list";
            // Same chunk as Play/Menu: these modals are only used from there and share
            // deps with Play; a separate "modals" chunk caused Rollup circular chunk warnings.
            if (
              id.includes("components/PackChoiceModal") ||
              id.includes("components/ChoosePuzzleModal")
            ) {
              return "play-setup";
            }
            // Split vendor chunks to avoid a single >500kB bundle
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("react/")) {
                return "react";
              }
              if (id.includes("react-router")) {
                return "router";
              }
              if (id.includes("@supabase")) {
                return "supabase";
              }
              // Other node_modules (lucide-react, posthog-js, etc.)
              return "vendor";
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
      ),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "",
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/app"),
        "@assets": path.resolve(__dirname, "./src/app/assets"),
        "@components": path.resolve(__dirname, "./src/app/components"),
        "@data": path.resolve(__dirname, "./src/app/assets"),
        "@screens": path.resolve(__dirname, "./src/app/screens"),
        "@puzzle": path.resolve(__dirname, "./src/app/puzzle"),
      },
    },
  };
});
