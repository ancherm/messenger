import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  server: {
    proxy: {
      "/auth": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:8888",
        changeOrigin: true,
      },
      "/ws": {
        target: "http://localhost:8888",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
