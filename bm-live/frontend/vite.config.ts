import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://server:8080", //フロントの Vite プロキシが叩いている宛先に接続できない // コンテナ内の localhost は “frontend 自分自身” を指します。API は別コンテナ(server) なので、Docker 内部ホスト名 http://server:8080 を使う必要がある
        changeOrigin: true,
      },
    },
  },
});
