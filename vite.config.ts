import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from .env files AND process.env (Vercel injects here)
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
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
              // Other node_modules (lucide-react, canvas-confetti, etc.)
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
