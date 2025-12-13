import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig(async () => {
  const plugins = [
    react(),
    tailwindcss()
  ];

  // Load Replit-only plugins safely (dev only)
  if (!isProduction) {
    try {
      const runtimeError = await import("@replit/vite-plugin-runtime-error-modal");
      const devBanner = await import("@replit/vite-plugin-dev-banner");

      plugins.push(
        runtimeError.default(),
        devBanner.default()
      );
    } catch {
      // ignore if not present
    }
  }

  return {
    root: "client",

    plugins,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src")
      }
    },

    build: {
      outDir: "../dist/client",
      emptyOutDir: true
    },

    server: {
      port: 5000
    }
  };
});
