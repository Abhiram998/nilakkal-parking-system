import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Detect production / Render environment
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.RENDER === "true";

export default defineConfig(async () => {
  const plugins = [
    react(),
    tailwindcss()
  ];

  // Load Replit-only plugins safely
  if (!isProduction) {
    try {
      const runtimeError = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      const devBanner = await import(
        "@replit/vite-plugin-dev-banner"
      );

      plugins.push(
        runtimeError.default(),
        devBanner.default()
      );
    } catch {
      // Ignore if plugins are not installed
    }
  }

  return {
    root: "client",

    plugins,

    resolve: {
      alias: {
        "@": "/client/src"
      }
    },

    server: {
      port: 5000
    },

    build: {
      outDir: "../dist/client",
      emptyOutDir: true
    }
  };
});
