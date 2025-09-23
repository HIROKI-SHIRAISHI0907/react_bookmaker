import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // いまは host.docker.internal が確実（後で server:8080 に戻すのは可）
  const target = env.VITE_API_ORIGIN || "http://host.docker.internal:8080";

  return {
    plugins: [react(), tsconfigPaths()],
    server: {
      host: true,
      port: 3000,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: false,
          // ★ バックエンドが /api を持っているので rewrite は不要
          // rewrite: (p) => p.replace(/^\/api/, ''), ← 使わない
        },
      },
    },
  };
});
