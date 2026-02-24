import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const base = mode === "admin" ? "/admin/" : "/";

  return {
    base,
    plugins: [react(), tsconfigPaths()],
  };
});
