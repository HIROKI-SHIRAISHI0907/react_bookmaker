import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/v1/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
