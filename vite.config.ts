import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load env from .env files AND process.env (Vercel injects here)
  const env = loadEnv(mode, process.cwd(), "");
  return {
  plugins: [react()],
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
