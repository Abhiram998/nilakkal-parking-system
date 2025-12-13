import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(async () => {
  const isRender =
    process.env.RENDER === "true" ||
    process.env.NODE_ENV === "production";

  const replitPlugins: any[] = [];

  if (!isRender) {
    try {
      const runtimeError = await import(
        "@replit/vite-plugin-runtime-error-modal"
      );
      const devBanner = await import(
        "@replit/vite-plugin-dev-banner"
      );

      replitPlugins.push(
        runtimeError.default(),
        devBanner.default()
      );
    } catch {}
  }

  return {
    root: "client",

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client/src")
      }
    },

    plugins: [
      react(),
      tailwindcss(),
      ...replitPlugins
    ],

    build: {
      outDir: "../dist/client",
      emptyOutDir: true
    },

    server: {
      port: 5000
    }
  };
});
